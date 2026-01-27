// ==================== 游戏主引擎 ====================

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        // 游戏配置
        this.config = {
            tileSize: 40,
            mazeWidth: 25,
            mazeHeight: 20,
            viewportTilesX: 15,
            viewportTilesY: 12
        };

        // 游戏状态
        this.state = {
            chapter: 1,
            floor: 1,
            gameOver: false,
            inBattle: false,
            inShop: false,
            inDialog: false,
            inStory: false
        };

        // 玩家数据
        this.player = {
            x: 1, y: 1,
            hp: 100, maxHp: 100,
            attack: 15, defense: 8,
            level: 1, exp: 0, expToNext: 100,
            gold: 50,
            inventory: [],
            maxInventory: 20,
            equipment: { weapon: null, armor: null, accessory: null },
            buffs: { attack: 0, defense: 0 },
            hasReviver: false,
            // 第二章新属性
            pollution: 0,
            maxPollution: 100,
            bleeding: false,
            bleedingTurns: 0
        };

        // 地图数据
        this.maze = [];
        this.entities = [];
        this.items = [];
        this.stairsPos = null;
        this.explored = [];

        // 开放世界数据
        this.portals = [];
        this.currentArea = "central";
        this.defeatedBosses = [];
        this.areaExplored = {};  // Track explored areas
        this.worldPollution = 100;  // Global pollution level (0-100, start at max)

        // 当前战斗/交互对象
        this.currentEnemy = null;
        this.currentNPC = null;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.generateFloor();
        this.setupControls();
        this.setupMobileControls();
        this.gameLoop();
        this.showChapterIntro();
    }

    showChapterIntro() {
        const chapter = CHAPTERS[this.state.chapter];
        this.addMessage(`=== ${chapter.name} ===`, "system");
        this.addMessage(chapter.description, "system");
        this.addMessage("使用方向键移动，Z攻击，空格拾取/交互", "system");
    }

    showStory(storyLines, callback) {
        this.state.inStory = true;
        let index = 0;

        const storyOverlay = document.getElementById('story-overlay');
        const storyText = document.getElementById('story-text');
        const storyNext = document.getElementById('story-next');

        storyOverlay.classList.remove('hidden');

        const showNext = () => {
            if (index < storyLines.length) {
                storyText.textContent = storyLines[index];
                index++;
            } else {
                storyOverlay.classList.add('hidden');
                this.state.inStory = false;
                if (callback) callback();
            }
        };

        storyNext.onclick = showNext;
        showNext();
    }

    setupCanvas() {
        const updateSize = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const isTablet = screenWidth >= 600 && screenWidth <= 1024;
            const isPhone = screenWidth < 600;
            const isLandscape = screenWidth > screenHeight;
            const isSmallPhone = screenWidth <= 380;
            const isLargePhone = screenWidth > 414 && screenWidth < 600;

            let maxWidth, maxHeight;

            if (isTablet) {
                if (isLandscape) {
                    // iPad landscape: side panel visible
                    maxWidth = Math.min(screenWidth - 290, 700);
                    maxHeight = Math.min(screenHeight - 280, 400);
                } else {
                    // iPad portrait: full width, more height for game
                    maxWidth = Math.min(screenWidth - 30, 800);
                    maxHeight = Math.min(screenHeight - 450, 450);
                }
            } else if (isPhone) {
                if (isLandscape) {
                    // iPhone landscape
                    maxWidth = screenWidth - 20;
                    maxHeight = Math.min(screenHeight - 180, 280);
                } else {
                    // iPhone portrait
                    const controlsHeight = 200; // Space for touch controls
                    const topUIHeight = isSmallPhone ? 100 : 120; // Top bar + messages
                    maxWidth = screenWidth - 10;
                    maxHeight = Math.min(screenHeight - controlsHeight - topUIHeight, isSmallPhone ? 280 : 320);
                }
            } else {
                // Desktop
                maxWidth = Math.min(800, screenWidth - 280);
                maxHeight = Math.min(480, screenHeight - 250);
            }

            this.canvas.width = Math.max(280, maxWidth);
            this.canvas.height = Math.max(200, maxHeight);

            // Adjust tile size based on device
            if (isTablet) {
                this.config.tileSize = isLandscape ? 36 : 38;
            } else if (isPhone) {
                if (isLandscape) {
                    this.config.tileSize = 28;
                } else if (isSmallPhone) {
                    this.config.tileSize = 32;
                } else if (isLargePhone) {
                    this.config.tileSize = 36;
                } else {
                    this.config.tileSize = 34;
                }
            } else {
                this.config.tileSize = 40;
            }

            this.config.viewportTilesX = Math.floor(this.canvas.width / this.config.tileSize);
            this.config.viewportTilesY = Math.floor(this.canvas.height / this.config.tileSize);

            // 小地图
            this.minimapCanvas.width = this.minimapCanvas.offsetWidth || 200;
            this.minimapCanvas.height = isTablet ? 100 : (isPhone ? 80 : 120);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        window.addEventListener('orientationchange', () => {
            // Delay to let iOS finish rotation animation
            setTimeout(updateSize, 150);
        });
        // Also handle iOS visual viewport changes
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateSize);
        }
    }

    // ==================== 迷宫生成 ====================

    generateFloor() {
        this.maze = [];
        this.entities = [];
        this.items = [];
        this.explored = [];

        const chapter = CHAPTERS[this.state.chapter];

        // 初始化迷宫（全墙）
        for (let y = 0; y < this.config.mazeHeight; y++) {
            this.maze[y] = [];
            this.explored[y] = [];
            for (let x = 0; x < this.config.mazeWidth; x++) {
                this.maze[y][x] = 1; // 1 = 墙
                this.explored[y][x] = false;
            }
        }

        // 根据章节生成不同地图
        if (chapter.mapType === 'openWorld') {
            this.generateOpenWorldMap();
            return;  // Open world has its own placement logic
        } else if (chapter.mapType === 'surface') {
            this.generateSurfaceMap();
        } else {
            // 使用递归回溯算法生成迷宫
            this.carveMaze(1, 1);
            // 创建一些房间
            this.createRooms();
        }

        // 放置玩家
        this.player.x = 1;
        this.player.y = 1;
        this.maze[1][1] = 0;

        // 放置楼梯
        this.placeStairs();

        // 检查是否是BOSS层
        const boss = getBossForFloor(this.state.chapter, this.state.floor);
        if (boss) {
            this.spawnBoss(boss);
        } else {
            // 根据章节生成不同敌人
            if (this.state.chapter === 1) {
                this.spawnPokemon();
            } else {
                this.spawnChapter2Enemies();
            }
        }

        // 生成道具
        this.spawnItems();

        // 重置buff
        this.player.buffs = { attack: 0, defense: 0 };

        const chapterName = chapter.name.split('：')[0];
        this.addMessage(`${chapterName} - 第 ${this.state.floor} 层`, "system");

        // 处理流血状态
        if (this.player.bleeding) {
            this.player.bleedingTurns--;
            const bleedDamage = 3;
            this.player.hp -= bleedDamage;
            this.addMessage(`流血！受到 ${bleedDamage} 点伤害！`, "battle");
            if (this.player.bleedingTurns <= 0) {
                this.player.bleeding = false;
                this.addMessage("流血停止了。", "system");
            }
        }

        this.updatePlayerStats();
    }

    generateSurfaceMap() {
        // 地面世界：更开阔的地图，有废墟和毒沼
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            for (let x = 1; x < this.config.mazeWidth - 1; x++) {
                // 70%概率是通道
                if (Math.random() < 0.7) {
                    this.maze[y][x] = 0;
                }
            }
        }

        // 创建一些废墟（墙壁群）
        const numRuins = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numRuins; i++) {
            const rx = 3 + Math.floor(Math.random() * (this.config.mazeWidth - 6));
            const ry = 3 + Math.floor(Math.random() * (this.config.mazeHeight - 6));
            const rw = 2 + Math.floor(Math.random() * 3);
            const rh = 2 + Math.floor(Math.random() * 3);

            for (let y = ry; y < ry + rh && y < this.config.mazeHeight - 1; y++) {
                for (let x = rx; x < rx + rw && x < this.config.mazeWidth - 1; x++) {
                    if (Math.random() < 0.6) {
                        this.maze[y][x] = 1;
                    }
                }
            }
        }

        // 确保起点附近有通路
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (y > 0 && x > 0) {
                    this.maze[y][x] = 0;
                }
            }
        }
    }

    generateOpenWorldMap() {
        const area = OPEN_WORLD_AREAS[this.currentArea];
        this.portals = [];
        this.entities = [];
        this.items = [];

        // Reset explored for new area (but keep tracking which areas visited)
        this.explored = [];
        for (let y = 0; y < this.config.mazeHeight; y++) {
            this.explored[y] = [];
            for (let x = 0; x < this.config.mazeWidth; x++) {
                this.explored[y][x] = false;
            }
        }

        // Mark this area as visited
        if (!this.areaExplored[this.currentArea]) {
            this.areaExplored[this.currentArea] = true;
        }

        // Generate area-specific terrain
        this.generateAreaTerrain(area);

        // Place player at spawn point (center for first visit, or near portal otherwise)
        if (!this.areaExplored[this.currentArea + '_visited']) {
            this.player.x = Math.floor(this.config.mazeWidth / 2);
            this.player.y = Math.floor(this.config.mazeHeight / 2);
            this.areaExplored[this.currentArea + '_visited'] = true;
        }
        this.maze[this.player.y][this.player.x] = 0;

        // Place portals
        this.placePortals();

        // Place enemies based on area
        this.spawnOpenWorldEnemies(area);

        // Place items
        this.spawnItems();

        // Place area boss if not defeated
        if (area.bossId && !this.defeatedBosses.includes(area.bossId)) {
            this.placeAreaBoss(area);
        }

        // Place healer
        const healer = SURFACE_HEALERS[Math.floor(Math.random() * SURFACE_HEALERS.length)];
        this.placePokemon(healer);

        // Place shop
        if (Math.random() < 0.7) {
            const shopPokemon = POKEMON_DATA.filter(p => p.type === 'shop');
            this.placePokemon(shopPokemon[Math.floor(Math.random() * shopPokemon.length)]);
        }

        // Update exploration
        this.updateExplored();

        // Reset buff
        this.player.buffs = { attack: 0, defense: 0 };

        // Show area message
        this.addMessage(`=== ${area.name} ===`, "system");
        this.addMessage(area.description, "system");

        // Show world pollution status
        this.addMessage(`世界污染度: ${this.worldPollution}%`, "system");

        if (area.hazard) {
            this.addMessage(`⚠️ 警告: 此区域有环境危害！`, "system");
        }

        this.updatePlayerStats();
    }

    generateAreaTerrain(area) {
        // Initialize maze with walls
        for (let y = 0; y < this.config.mazeHeight; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.config.mazeWidth; x++) {
                this.maze[y][x] = 1;
            }
        }

        // Different terrain generation based on area
        switch (area.id) {
            case 'central':
                this.generateCityTerrain();
                break;
            case 'forest':
                this.generateForestTerrain();
                break;
            case 'swamp':
                this.generateSwampTerrain();
                break;
            case 'ruins':
                this.generateRuinsTerrain();
                break;
            case 'sanctuary':
                this.generateSanctuaryTerrain();
                break;
            default:
                this.generateOpenTerrain();
        }
    }

    generateCityTerrain() {
        // City ruins: grid-like streets with building blocks
        // Create main streets (cross pattern)
        const midX = Math.floor(this.config.mazeWidth / 2);
        const midY = Math.floor(this.config.mazeHeight / 2);

        // Horizontal main street
        for (let x = 1; x < this.config.mazeWidth - 1; x++) {
            this.maze[midY][x] = 0;
            this.maze[midY - 1][x] = 0;
            this.maze[midY + 1][x] = 0;
        }

        // Vertical main street
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            this.maze[y][midX] = 0;
            this.maze[y][midX - 1] = 0;
            this.maze[y][midX + 1] = 0;
        }

        // Create secondary streets
        for (let y = 3; y < this.config.mazeHeight - 3; y += 4) {
            for (let x = 1; x < this.config.mazeWidth - 1; x++) {
                if (Math.random() < 0.8) this.maze[y][x] = 0;
            }
        }
        for (let x = 3; x < this.config.mazeWidth - 3; x += 5) {
            for (let y = 1; y < this.config.mazeHeight - 1; y++) {
                if (Math.random() < 0.8) this.maze[y][x] = 0;
            }
        }

        // Add some random rubble/openings
        for (let i = 0; i < 30; i++) {
            const x = 2 + Math.floor(Math.random() * (this.config.mazeWidth - 4));
            const y = 2 + Math.floor(Math.random() * (this.config.mazeHeight - 4));
            this.maze[y][x] = 0;
        }
    }

    generateForestTerrain() {
        // Forest: mostly open with scattered tree clusters
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            for (let x = 1; x < this.config.mazeWidth - 1; x++) {
                if (Math.random() < 0.75) {
                    this.maze[y][x] = 0;
                }
            }
        }

        // Create dense tree clusters
        for (let i = 0; i < 5; i++) {
            const cx = 3 + Math.floor(Math.random() * (this.config.mazeWidth - 6));
            const cy = 3 + Math.floor(Math.random() * (this.config.mazeHeight - 6));
            const size = 2 + Math.floor(Math.random() * 2);

            for (let dy = -size; dy <= size; dy++) {
                for (let dx = -size; dx <= size; dx++) {
                    const x = cx + dx;
                    const y = cy + dy;
                    if (x > 0 && x < this.config.mazeWidth - 1 &&
                        y > 0 && y < this.config.mazeHeight - 1) {
                        if (Math.random() < 0.6) {
                            this.maze[y][x] = 1;
                        }
                    }
                }
            }
        }

        // Ensure paths exist
        this.ensurePathConnectivity();
    }

    generateSwampTerrain() {
        // Swamp: winding paths through toxic pools
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            for (let x = 1; x < this.config.mazeWidth - 1; x++) {
                // Fewer walkable areas
                if (Math.random() < 0.55) {
                    this.maze[y][x] = 0;
                }
            }
        }

        // Create winding paths
        let px = 2, py = 2;
        for (let i = 0; i < 50; i++) {
            this.maze[py][px] = 0;
            const dir = Math.floor(Math.random() * 4);
            switch (dir) {
                case 0: if (py > 2) py--; break;
                case 1: if (py < this.config.mazeHeight - 3) py++; break;
                case 2: if (px > 2) px--; break;
                case 3: if (px < this.config.mazeWidth - 3) px++; break;
            }
        }

        this.ensurePathConnectivity();
    }

    generateRuinsTerrain() {
        // Ancient ruins: structured rooms connected by corridors
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            for (let x = 1; x < this.config.mazeWidth - 1; x++) {
                this.maze[y][x] = 1;
            }
        }

        // Create rooms
        const rooms = [];
        for (let i = 0; i < 6; i++) {
            const roomW = 3 + Math.floor(Math.random() * 3);
            const roomH = 3 + Math.floor(Math.random() * 3);
            const roomX = 2 + Math.floor(Math.random() * (this.config.mazeWidth - roomW - 4));
            const roomY = 2 + Math.floor(Math.random() * (this.config.mazeHeight - roomH - 4));

            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    if (y < this.config.mazeHeight - 1 && x < this.config.mazeWidth - 1) {
                        this.maze[y][x] = 0;
                    }
                }
            }
            rooms.push({ x: roomX + Math.floor(roomW / 2), y: roomY + Math.floor(roomH / 2) });
        }

        // Connect rooms with corridors
        for (let i = 0; i < rooms.length - 1; i++) {
            const from = rooms[i];
            const to = rooms[i + 1];
            this.carveCorridor(from.x, from.y, to.x, to.y);
        }
    }

    generateSanctuaryTerrain() {
        // Sanctuary: grand open area with central chamber
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            for (let x = 1; x < this.config.mazeWidth - 1; x++) {
                this.maze[y][x] = 0;
            }
        }

        // Create pillars around the edges
        for (let x = 3; x < this.config.mazeWidth - 3; x += 3) {
            this.maze[2][x] = 1;
            this.maze[this.config.mazeHeight - 3][x] = 1;
        }
        for (let y = 3; y < this.config.mazeHeight - 3; y += 3) {
            this.maze[y][2] = 1;
            this.maze[y][this.config.mazeWidth - 3] = 1;
        }

        // Central altar platform
        const midX = Math.floor(this.config.mazeWidth / 2);
        const midY = Math.floor(this.config.mazeHeight / 2);
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
                    if (!(dx === 0 || dy === 0)) {
                        this.maze[midY + dy][midX + dx] = 1;
                    }
                }
            }
        }
    }

    generateOpenTerrain() {
        // Generic open terrain
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            for (let x = 1; x < this.config.mazeWidth - 1; x++) {
                if (Math.random() < 0.7) {
                    this.maze[y][x] = 0;
                }
            }
        }
        this.ensurePathConnectivity();
    }

    carveCorridor(x1, y1, x2, y2) {
        // Carve L-shaped corridor
        let x = x1, y = y1;

        // Horizontal first
        while (x !== x2) {
            if (x >= 1 && x < this.config.mazeWidth - 1) {
                this.maze[y][x] = 0;
            }
            x += x < x2 ? 1 : -1;
        }
        // Then vertical
        while (y !== y2) {
            if (y >= 1 && y < this.config.mazeHeight - 1) {
                this.maze[y][x] = 0;
            }
            y += y < y2 ? 1 : -1;
        }
    }

    ensurePathConnectivity() {
        // Simple flood fill to ensure connectivity
        const midX = Math.floor(this.config.mazeWidth / 2);
        const midY = Math.floor(this.config.mazeHeight / 2);

        // Make sure center is walkable
        this.maze[midY][midX] = 0;

        // Create paths to edges
        for (let x = 1; x < this.config.mazeWidth - 1; x++) {
            this.maze[midY][x] = 0;
        }
        for (let y = 1; y < this.config.mazeHeight - 1; y++) {
            this.maze[y][midX] = 0;
        }
    }

    placePortals() {
        // Get portals for current area
        const areaPortals = Object.values(PORTAL_DATA).filter(p => p.fromArea === this.currentArea);

        for (const portalData of areaPortals) {
            // Check if portal requires bosses to be defeated
            if (portalData.requiresBosses) {
                const allDefeated = portalData.requiresBosses.every(bossId =>
                    this.defeatedBosses.includes(bossId));
                if (!allDefeated) continue;  // Skip this portal
            }

            this.placePortal(portalData);
        }
    }

    placePortal(portalData) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 100) {
            // Place portals near edges for return, or spread out for destinations
            let x, y;
            if (portalData.toArea === 'central') {
                // Return portals near spawn
                x = 2 + Math.floor(Math.random() * 3);
                y = 2 + Math.floor(Math.random() * 3);
            } else {
                // Destination portals at edges
                const edge = Math.floor(Math.random() * 4);
                switch (edge) {
                    case 0: // Top
                        x = 3 + Math.floor(Math.random() * (this.config.mazeWidth - 6));
                        y = 2;
                        break;
                    case 1: // Bottom
                        x = 3 + Math.floor(Math.random() * (this.config.mazeWidth - 6));
                        y = this.config.mazeHeight - 3;
                        break;
                    case 2: // Left
                        x = 2;
                        y = 3 + Math.floor(Math.random() * (this.config.mazeHeight - 6));
                        break;
                    case 3: // Right
                        x = this.config.mazeWidth - 3;
                        y = 3 + Math.floor(Math.random() * (this.config.mazeHeight - 6));
                        break;
                }
            }

            // Ensure position is valid
            if (this.maze[y][x] === 0 &&
                !this.getEntityAt(x, y) &&
                !this.getPortalAt(x, y) &&
                (x !== this.player.x || y !== this.player.y)) {

                const portal = {
                    ...portalData,
                    x, y
                };
                this.portals.push(portal);
                placed = true;

                // Carve space around portal
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx > 0 && nx < this.config.mazeWidth - 1 &&
                            ny > 0 && ny < this.config.mazeHeight - 1) {
                            this.maze[ny][nx] = 0;
                        }
                    }
                }
            }
            attempts++;
        }
    }

    getPortalAt(x, y) {
        return this.portals.find(p => p.x === x && p.y === y);
    }

    teleportToArea(portal) {
        const targetArea = portal.toArea;

        this.addMessage(`正在传送到 ${OPEN_WORLD_AREAS[targetArea].name}...`, "system");

        // Change current area
        this.currentArea = targetArea;

        // Generate new area map
        this.generateOpenWorldMap();

        // Find spawn position near the return portal
        const returnPortal = this.portals.find(p => p.toArea !== this.currentArea);
        if (returnPortal) {
            // Spawn near return portal
            this.player.x = returnPortal.x + 1;
            this.player.y = returnPortal.y;
            if (this.maze[this.player.y][this.player.x] !== 0) {
                this.player.x = returnPortal.x;
                this.player.y = returnPortal.y + 1;
            }
        }

        this.updateExplored();
    }

    spawnOpenWorldEnemies(area) {
        const numEnemies = 8 + Math.floor(Math.random() * 5);
        const enemyTypes = area.enemies || ['zombie', 'polluted'];

        for (let i = 0; i < numEnemies; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            let enemyData;

            if (type === 'zombie') {
                enemyData = ZOMBIE_DATA[Math.floor(Math.random() * ZOMBIE_DATA.length)];
            } else {
                enemyData = POLLUTED_POKEMON_DATA[Math.floor(Math.random() * POLLUTED_POKEMON_DATA.length)];
            }

            this.placePokemon(enemyData);
        }
    }

    placeAreaBoss(area) {
        const bossData = BOSS_DATA.chapter2.find(b => b.id === area.bossId);
        if (!bossData) return;

        // Place boss at a strategic location
        const midX = Math.floor(this.config.mazeWidth / 2);
        const midY = Math.floor(this.config.mazeHeight / 2);

        // Clear area for boss
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = midX + dx;
                const ny = midY + dy;
                if (nx > 0 && nx < this.config.mazeWidth - 1 &&
                    ny > 0 && ny < this.config.mazeHeight - 1) {
                    this.maze[ny][nx] = 0;
                }
            }
        }

        // Offset boss from center so player can approach
        const bossX = midX + 3;
        const bossY = midY;

        if (bossX > 0 && bossX < this.config.mazeWidth - 1) {
            const boss = {
                ...bossData,
                x: bossX,
                y: bossY,
                currentHp: bossData.hp,
                maxHp: bossData.hp,
                isBoss: true,
                buffedAttack: 0,
                buffedDefense: 0,
                specialCooldown: 0
            };
            this.entities.push(boss);

            this.addMessage(`⚠️ ${bossData.name} 在此区域徘徊！`, "system");
        }
    }

    handleAreaHazard() {
        const area = OPEN_WORLD_AREAS[this.currentArea];
        if (!area || !area.hazard) return;

        if (area.hazard.type === 'pollution') {
            const pollutionResist = this.player.equipment.accessory?.stats?.pollutionResist || 0;
            const damage = Math.floor(area.hazard.value * (1 - pollutionResist));

            if (damage > 0) {
                this.player.pollution = Math.min(this.player.maxPollution, this.player.pollution + damage);
                this.addMessage(`环境污染！污染值+${damage}`, "system");

                if (this.player.pollution >= this.player.maxPollution) {
                    this.addMessage(`污染值已满！你被完全污染了...`, "system");
                    this.player.hp = 0;
                    this.gameOver();
                }
            }
        }

        this.updatePlayerStats();
    }

    spawnChapter2Enemies() {
        const floor = this.state.floor;
        const numEnemies = 6 + Math.floor(floor * 0.5);

        // 放置僵尸
        const numZombies = Math.floor(numEnemies * 0.4);
        for (let i = 0; i < numZombies; i++) {
            const zombie = ZOMBIE_DATA[Math.floor(Math.random() * ZOMBIE_DATA.length)];
            this.placePokemon(zombie);
        }

        // 放置污染宝可梦
        const numPolluted = Math.floor(numEnemies * 0.4);
        for (let i = 0; i < numPolluted; i++) {
            const polluted = POLLUTED_POKEMON_DATA[Math.floor(Math.random() * POLLUTED_POKEMON_DATA.length)];
            this.placePokemon(polluted);
        }

        // 放置治疗者
        const healer = SURFACE_HEALERS[Math.floor(Math.random() * SURFACE_HEALERS.length)];
        this.placePokemon(healer);

        // 偶尔还有普通商店
        if (Math.random() < 0.5) {
            const shopPokemon = POKEMON_DATA.filter(p => p.type === 'shop');
            this.placePokemon(shopPokemon[Math.floor(Math.random() * shopPokemon.length)]);
        }
    }

    spawnBoss(bossData) {
        // 显示BOSS警告
        this.addMessage("⚠️ 警告：检测到强大的敌人！", "system");
        this.addMessage(bossData.intro, "system");

        // 创建BOSS房间 (大房间)
        const roomCenterX = Math.floor(this.config.mazeWidth / 2);
        const roomCenterY = Math.floor(this.config.mazeHeight / 2);

        // 清空5x5的BOSS房间
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = roomCenterX + dx;
                const ny = roomCenterY + dy;
                if (nx > 0 && nx < this.config.mazeWidth - 1 &&
                    ny > 0 && ny < this.config.mazeHeight - 1) {
                    this.maze[ny][nx] = 0;
                }
            }
        }

        // 创建通往BOSS房间的通道
        for (let x = 2; x < roomCenterX - 2; x++) {
            this.maze[roomCenterY][x] = 0;
        }

        // 放置BOSS
        const boss = {
            ...bossData,
            x: roomCenterX,
            y: roomCenterY,
            currentHp: bossData.hp,
            maxHp: bossData.hp,
            isBoss: true,
            buffedAttack: 0,
            buffedDefense: 0,
            specialCooldown: 0
        };
        this.entities.push(boss);

        // BOSS层不放其他敌人，但放一个治疗者
        if (this.state.chapter === 1) {
            const healerPokemon = POKEMON_DATA.filter(p => p.type === 'healer');
            this.placePokemon(healerPokemon[Math.floor(Math.random() * healerPokemon.length)]);
        } else {
            const healer = SURFACE_HEALERS[Math.floor(Math.random() * SURFACE_HEALERS.length)];
            this.placePokemon(healer);
        }
    }

    carveMaze(x, y) {
        const directions = [
            [0, -2], [0, 2], [-2, 0], [2, 0]
        ];

        // 随机打乱方向
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        this.maze[y][x] = 0;

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx > 0 && nx < this.config.mazeWidth - 1 &&
                ny > 0 && ny < this.config.mazeHeight - 1 &&
                this.maze[ny][nx] === 1) {

                this.maze[y + dy / 2][x + dx / 2] = 0;
                this.carveMaze(nx, ny);
            }
        }
    }

    createRooms() {
        const numRooms = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numRooms; i++) {
            const roomW = 3 + Math.floor(Math.random() * 3);
            const roomH = 3 + Math.floor(Math.random() * 3);
            const roomX = 2 + Math.floor(Math.random() * (this.config.mazeWidth - roomW - 4));
            const roomY = 2 + Math.floor(Math.random() * (this.config.mazeHeight - roomH - 4));

            for (let y = roomY; y < roomY + roomH && y < this.config.mazeHeight - 1; y++) {
                for (let x = roomX; x < roomX + roomW && x < this.config.mazeWidth - 1; x++) {
                    this.maze[y][x] = 0;
                }
            }
        }
    }

    placeStairs() {
        let placed = false;
        while (!placed) {
            const x = Math.floor(Math.random() * (this.config.mazeWidth - 2)) + 1;
            const y = Math.floor(Math.random() * (this.config.mazeHeight - 2)) + 1;

            if (this.maze[y][x] === 0 && (x !== this.player.x || y !== this.player.y)) {
                const dist = Math.abs(x - this.player.x) + Math.abs(y - this.player.y);
                if (dist > 10) {
                    this.stairsPos = { x, y };
                    placed = true;
                }
            }
        }
    }

    spawnPokemon() {
        const floor = this.state.floor;
        const numPokemon = 5 + Math.floor(floor * 1.5);

        // 确保有商店和治疗
        const shopPokemon = POKEMON_DATA.filter(p => p.type === 'shop');
        const healerPokemon = POKEMON_DATA.filter(p => p.type === 'healer');
        const hostilePokemon = POKEMON_DATA.filter(p => p.type === 'hostile');

        // 放置一个商店
        this.placePokemon(shopPokemon[Math.floor(Math.random() * shopPokemon.length)]);

        // 放置一个治疗者
        this.placePokemon(healerPokemon[Math.floor(Math.random() * healerPokemon.length)]);

        // 放置敌对宝可梦
        for (let i = 0; i < numPokemon; i++) {
            const pokemon = hostilePokemon[Math.floor(Math.random() * hostilePokemon.length)];
            this.placePokemon(pokemon);
        }
    }

    placePokemon(pokemonData) {
        let placed = false;
        let attempts = 0;
        const needsRoom = pokemonData.type === 'shop' || pokemonData.type === 'healer';

        while (!placed && attempts < 100) {
            const x = Math.floor(Math.random() * (this.config.mazeWidth - 4)) + 2;
            const y = Math.floor(Math.random() * (this.config.mazeHeight - 4)) + 2;

            if (this.maze[y][x] === 0 &&
                (x !== this.player.x || y !== this.player.y) &&
                !this.getEntityAt(x, y) &&
                (x !== this.stairsPos?.x || y !== this.stairsPos?.y)) {

                // For shop and healer, create a small room around them
                if (needsRoom) {
                    // Check we have space to carve a room (not too close to edges)
                    if (x >= 2 && x < this.config.mazeWidth - 2 &&
                        y >= 2 && y < this.config.mazeHeight - 2) {
                        // Carve a 3x3 room around the NPC
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx > 0 && nx < this.config.mazeWidth - 1 &&
                                    ny > 0 && ny < this.config.mazeHeight - 1) {
                                    this.maze[ny][nx] = 0;
                                }
                            }
                        }
                        // Ensure at least one entrance to the room
                        const entrances = [
                            { dx: 0, dy: -2 }, // top
                            { dx: 0, dy: 2 },  // bottom
                            { dx: -2, dy: 0 }, // left
                            { dx: 2, dy: 0 }   // right
                        ];
                        // Pick a random entrance and carve path to it
                        const entrance = entrances[Math.floor(Math.random() * entrances.length)];
                        const ex = x + entrance.dx;
                        const ey = y + entrance.dy;
                        if (ex > 0 && ex < this.config.mazeWidth - 1 &&
                            ey > 0 && ey < this.config.mazeHeight - 1) {
                            this.maze[ey][ex] = 0;
                            // Also carve the tile between room and entrance
                            this.maze[y + entrance.dy / 2][x + entrance.dx / 2] = 0;
                        }
                    }
                }

                const pokemon = {
                    ...pokemonData,
                    x, y,
                    currentHp: pokemonData.hp || 100,
                    maxHp: pokemonData.hp || 100,
                    // 调整属性基于楼层
                    attack: (pokemonData.attack || 10) + this.state.floor * 2,
                    defense: (pokemonData.defense || 5) + this.state.floor,
                    moveTimer: 0
                };

                this.entities.push(pokemon);
                placed = true;
            }
            attempts++;
        }
    }

    spawnItems() {
        const numItems = 3 + Math.floor(Math.random() * 4);

        // 根据章节选择可用道具池
        let itemPool = [...ALL_ITEMS];
        let equipPool = [...EQUIPMENT_DATA];

        if (this.state.chapter >= 2) {
            itemPool = [...itemPool, ...CHAPTER2_ITEMS.filter(i => i.type === 'consumable')];
            equipPool = [...equipPool, ...CHAPTER2_ITEMS.filter(i => i.type === 'equipment')];
        }

        for (let i = 0; i < numItems; i++) {
            // 根据稀有度随机选择道具
            const roll = Math.random();
            let item;

            if (roll < 0.5) {
                // 普通道具
                const common = itemPool.filter(i => i.rarity === 1);
                item = common[Math.floor(Math.random() * common.length)];
            } else if (roll < 0.8) {
                // 稀有道具
                const rare = itemPool.filter(i => i.rarity === 2);
                item = rare[Math.floor(Math.random() * rare.length)];
            } else {
                // 非常稀有
                const veryRare = itemPool.filter(i => i.rarity >= 3);
                item = veryRare[Math.floor(Math.random() * veryRare.length)];
            }

            if (item) this.placeItem(item);
        }

        // 偶尔放置装备
        if (Math.random() < 0.3) {
            const equip = equipPool[Math.floor(Math.random() * equipPool.length)];
            this.placeItem(equip);
        }
    }

    placeItem(itemData) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 100) {
            const x = Math.floor(Math.random() * (this.config.mazeWidth - 2)) + 1;
            const y = Math.floor(Math.random() * (this.config.mazeHeight - 2)) + 1;

            if (this.maze[y][x] === 0 &&
                (x !== this.player.x || y !== this.player.y) &&
                !this.getItemAt(x, y)) {

                this.items.push({ ...itemData, x, y });
                placed = true;
            }
            attempts++;
        }
    }

    // ==================== 游戏逻辑 ====================

    movePlayer(dx, dy) {
        if (this.state.gameOver || this.state.inBattle || this.state.inShop || this.state.inDialog) return;

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // 检查边界和墙
        if (newX < 0 || newX >= this.config.mazeWidth ||
            newY < 0 || newY >= this.config.mazeHeight ||
            this.maze[newY][newX] === 1) {
            return;
        }

        // 检查是否有宝可梦
        const entity = this.getEntityAt(newX, newY);
        if (entity) {
            this.interactWithEntity(entity);
            return;
        }

        // 移动
        this.player.x = newX;
        this.player.y = newY;

        // 更新探索区域
        this.updateExplored();

        // 检查楼梯 (not used in open world)
        if (this.stairsPos && newX === this.stairsPos.x && newY === this.stairsPos.y) {
            this.nextFloor();
        }

        // 检查传送门
        const portal = this.getPortalAt(newX, newY);
        if (portal) {
            this.addMessage(`发现了 ${portal.emoji} ${portal.name}！按空格键传送`, "item");
        }

        // 检查道具
        const item = this.getItemAt(newX, newY);
        if (item) {
            this.addMessage(`发现了 ${item.emoji} ${item.name}！按空格键拾取`, "item");
        }

        // 处理区域环境危害 (每回合)
        if (CHAPTERS[this.state.chapter]?.mapType === 'openWorld') {
            this.handleAreaHazard();
        }

        // 宝可梦AI移动
        this.updateEntities();
    }

    updateExplored() {
        const viewDist = 4;
        for (let dy = -viewDist; dy <= viewDist; dy++) {
            for (let dx = -viewDist; dx <= viewDist; dx++) {
                const x = this.player.x + dx;
                const y = this.player.y + dy;
                if (x >= 0 && x < this.config.mazeWidth &&
                    y >= 0 && y < this.config.mazeHeight) {
                    this.explored[y][x] = true;
                }
            }
        }
    }

    updateEntities() {
        for (const entity of this.entities) {
            if (entity.type !== 'hostile') continue;

            entity.moveTimer = (entity.moveTimer || 0) + 1;
            if (entity.moveTimer < 2) continue;
            entity.moveTimer = 0;

            const dist = Math.abs(entity.x - this.player.x) + Math.abs(entity.y - this.player.y);

            if (dist > 8) continue; // 太远不移动

            let dx = 0, dy = 0;

            if (entity.behavior === 'runner') {
                // 逃跑型：远离玩家
                if (dist < 5) {
                    dx = entity.x > this.player.x ? 1 : (entity.x < this.player.x ? -1 : 0);
                    dy = entity.y > this.player.y ? 1 : (entity.y < this.player.y ? -1 : 0);
                }
            } else {
                // 攻击型：靠近玩家
                if (dist > 1) {
                    dx = entity.x > this.player.x ? -1 : (entity.x < this.player.x ? 1 : 0);
                    dy = entity.y > this.player.y ? -1 : (entity.y < this.player.y ? 1 : 0);

                    // 随机选择一个方向
                    if (Math.random() < 0.5) dx = 0;
                    else dy = 0;
                }
            }

            const newX = entity.x + dx;
            const newY = entity.y + dy;

            if (newX > 0 && newX < this.config.mazeWidth - 1 &&
                newY > 0 && newY < this.config.mazeHeight - 1 &&
                this.maze[newY][newX] === 0 &&
                !this.getEntityAt(newX, newY) &&
                (newX !== this.player.x || newY !== this.player.y)) {

                entity.x = newX;
                entity.y = newY;
            }

            // 检查是否接触玩家
            if (entity.behavior === 'aggressive' &&
                Math.abs(entity.x - this.player.x) + Math.abs(entity.y - this.player.y) === 1) {
                // 有概率主动攻击
                if (Math.random() < 0.3) {
                    this.startBattle(entity);
                }
            }
        }
    }

    interactWithEntity(entity) {
        if (entity.type === 'hostile' || entity.type === 'zombie' || entity.type === 'polluted' || entity.type === 'boss') {
            this.startBattle(entity);
        } else if (entity.type === 'shop') {
            this.openShop(entity);
        } else if (entity.type === 'healer') {
            this.showHealerDialog(entity);
        }
    }

    // ==================== 战斗系统 ====================

    startBattle(enemy) {
        this.state.inBattle = true;
        this.currentEnemy = enemy;

        const battleOverlay = document.getElementById('battle-overlay');
        const battleBox = document.getElementById('battle-box');
        battleOverlay.classList.remove('hidden');

        // BOSS战斗特殊样式
        if (enemy.isBoss || enemy.type === 'boss') {
            battleBox.classList.add('boss-battle');
        } else {
            battleBox.classList.remove('boss-battle');
        }

        // 显示敌人像素精灵
        const spriteCanvas = document.getElementById('enemy-sprite-canvas');
        const spriteCtx = spriteCanvas.getContext('2d');
        spriteCtx.clearRect(0, 0, 96, 96);

        const spriteData = POKEMON_SPRITES[enemy.id];
        if (spriteData) {
            drawSprite(spriteCtx, spriteData, 0, 0, 96);
        }

        // BOSS显示特殊名称
        const enemyName = document.getElementById('enemy-name');
        if (enemy.isBoss || enemy.type === 'boss') {
            enemyName.textContent = `👑 BOSS: ${enemy.name}`;
            enemyName.style.color = '#ff6b6b';
        } else {
            enemyName.textContent = `${enemy.name} Lv.${this.state.floor + Math.floor(enemy.exp / 30)}`;
            enemyName.style.color = '';
        }
        this.updateEnemyHpBar();

        // 清空战斗日志
        document.getElementById('battle-log').innerHTML = '';

        // 显示敌人台词
        const dialogue = enemy.dialogues[Math.floor(Math.random() * enemy.dialogues.length)];
        this.addBattleLog(`${enemy.name}: "${dialogue}"`);

        // BOSS战斗不能逃跑
        const fleeBtn = document.getElementById('btn-flee');
        if (enemy.isBoss || enemy.type === 'boss') {
            fleeBtn.disabled = true;
            fleeBtn.textContent = '无法逃跑';
        } else {
            fleeBtn.disabled = false;
            fleeBtn.textContent = '逃跑';
        }

        // 设置按钮
        document.getElementById('btn-attack').onclick = () => this.battleAttack();
        document.getElementById('btn-skill').onclick = () => this.battleSkill();
        document.getElementById('btn-item').onclick = () => this.battleItem();
        fleeBtn.onclick = () => this.battleFlee();
    }

    updateEnemyHpBar() {
        const fill = document.getElementById('enemy-hp-fill');
        const percent = (this.currentEnemy.currentHp / this.currentEnemy.maxHp) * 100;
        fill.style.width = `${Math.max(0, percent)}%`;
    }

    addBattleLog(text) {
        const log = document.getElementById('battle-log');
        log.innerHTML += `<div>${text}</div>`;
        log.scrollTop = log.scrollHeight;
    }

    battleAttack() {
        const totalAttack = this.player.attack + this.player.buffs.attack +
            (this.player.equipment.weapon?.stats?.attack || 0);
        const damage = Math.max(1, totalAttack - this.currentEnemy.defense + Math.floor(Math.random() * 5));

        this.currentEnemy.currentHp -= damage;
        this.addBattleLog(`火柴人攻击！造成 ${damage} 点伤害！`);
        this.updateEnemyHpBar();

        if (this.currentEnemy.currentHp <= 0) {
            this.battleVictory();
        } else {
            this.enemyTurn();
        }
    }

    battleSkill() {
        // 技能攻击（消耗更多但伤害更高）
        const totalAttack = this.player.attack + this.player.buffs.attack +
            (this.player.equipment.weapon?.stats?.attack || 0);
        const damage = Math.max(1, Math.floor(totalAttack * 1.5) - this.currentEnemy.defense + Math.floor(Math.random() * 8));

        this.currentEnemy.currentHp -= damage;
        this.addBattleLog(`火柴人使用了必杀技！造成 ${damage} 点伤害！`);
        this.updateEnemyHpBar();

        if (this.currentEnemy.currentHp <= 0) {
            this.battleVictory();
        } else {
            this.enemyTurn();
        }
    }

    battleItem() {
        // 使用第一个可用的恢复道具
        const healItem = this.player.inventory.find(item =>
            item.effect && (item.effect.type === 'heal' || item.effect.type === 'fullHeal'));

        if (healItem) {
            this.useItem(healItem);
            this.enemyTurn();
        } else {
            this.addBattleLog("没有可用的道具！");
        }
    }

    battleFlee() {
        // 逃跑成功率
        const successRate = this.currentEnemy.behavior === 'runner' ? 0.9 : 0.5;

        if (Math.random() < successRate) {
            this.addBattleLog("成功逃跑了！");
            setTimeout(() => this.endBattle(false), 500);
        } else {
            this.addBattleLog("逃跑失败！");
            this.enemyTurn();
        }
    }

    enemyTurn() {
        const enemy = this.currentEnemy;
        const isBoss = enemy.isBoss || enemy.type === 'boss';

        // BOSS特殊攻击
        if (isBoss && enemy.specialAttacks && enemy.specialAttacks.length > 0) {
            // 减少冷却
            if (enemy.specialCooldown > 0) {
                enemy.specialCooldown--;
            }

            // 50%概率使用特殊攻击（如果不在冷却中）
            if (Math.random() < 0.5 || enemy.currentHp < enemy.maxHp * 0.3) {
                const availableSpecials = enemy.specialAttacks.filter(s => !s.cooldown || enemy.specialCooldown === 0);
                if (availableSpecials.length > 0) {
                    const special = availableSpecials[Math.floor(Math.random() * availableSpecials.length)];
                    this.executeBossSpecial(special);
                    if (special.cooldown) {
                        enemy.specialCooldown = 3;
                    }
                    this.updatePlayerStats();
                    if (this.player.hp <= 0) {
                        this.playerDefeated();
                    }
                    return;
                }
            }
        }

        // 普通攻击
        let enemyAttack = enemy.attack || 10;
        // BOSS可能有buff
        if (isBoss && enemy.buffedAttack) {
            enemyAttack += enemy.buffedAttack;
        }

        const totalDefense = this.player.defense + this.player.buffs.defense +
            (this.player.equipment.armor?.stats?.defense || 0);
        const damage = Math.max(1, enemyAttack - totalDefense + Math.floor(Math.random() * 3));

        this.player.hp -= damage;
        this.addBattleLog(`${enemy.name} 攻击！你受到 ${damage} 点伤害！`);

        // 僵尸攻击：流血概率
        if ((enemy.type === 'zombie' || enemy.bleedChance) && enemy.bleedChance) {
            if (Math.random() < enemy.bleedChance && !this.player.bleeding) {
                this.player.bleeding = true;
                this.player.bleedingTurns = 5;
                this.addBattleLog(`你被咬伤了！开始流血！`);
            }
        }

        // 污染宝可梦攻击：增加污染值
        if ((enemy.type === 'polluted' || enemy.pollutionDamage) && this.state.chapter >= 2) {
            let pollutionDamage = enemy.pollutionDamage || 5;

            // 防毒面具减少污染伤害
            const pollutionResist = this.player.equipment.accessory?.stats?.pollutionResist || 0;
            pollutionDamage = Math.floor(pollutionDamage * (1 - pollutionResist));

            this.player.pollution = Math.min(this.player.maxPollution, this.player.pollution + pollutionDamage);
            this.addBattleLog(`污染侵蚀！污染值+${pollutionDamage}`);

            // 污染值满了瞬间死亡
            if (this.player.pollution >= this.player.maxPollution) {
                this.addBattleLog(`污染值已满！你被完全污染了...`);
                this.player.hp = 0;
            }
        }

        this.updatePlayerStats();

        if (this.player.hp <= 0) {
            this.playerDefeated();
        }
    }

    executeBossSpecial(special) {
        const enemy = this.currentEnemy;
        this.addBattleLog(special.message);

        // 处理不同效果
        if (special.damage > 0) {
            let baseDamage = (enemy.attack || 10) * special.damage;

            // 无视防御
            if (special.ignoreDefense) {
                const damage = Math.floor(baseDamage + Math.floor(Math.random() * 10));
                this.player.hp -= damage;
                this.addBattleLog(`造成 ${damage} 点伤害！(无视防御)`);
            } else {
                const totalDefense = this.player.defense + this.player.buffs.defense +
                    (this.player.equipment.armor?.stats?.defense || 0);
                const damage = Math.max(1, Math.floor(baseDamage) - totalDefense + Math.floor(Math.random() * 5));
                this.player.hp -= damage;
                this.addBattleLog(`造成 ${damage} 点伤害！`);
            }
        }

        // 处理特殊效果
        if (special.effect) {
            switch (special.effect) {
                case 'bleed':
                    if (!this.player.bleeding) {
                        this.player.bleeding = true;
                        this.player.bleedingTurns = 5;
                        this.addBattleLog(`你开始流血！`);
                    }
                    break;
                case 'pollution':
                    if (this.state.chapter >= 2) {
                        const pollutionResist = this.player.equipment.accessory?.stats?.pollutionResist || 0;
                        const pollutionDamage = Math.floor((special.value || 10) * (1 - pollutionResist));
                        this.player.pollution = Math.min(this.player.maxPollution, this.player.pollution + pollutionDamage);
                        this.addBattleLog(`污染值+${pollutionDamage}`);
                        if (this.player.pollution >= this.player.maxPollution) {
                            this.addBattleLog(`污染值已满！`);
                            this.player.hp = 0;
                        }
                    }
                    break;
                case 'buff':
                    enemy.buffedAttack = (enemy.buffedAttack || 0) + 10;
                    this.addBattleLog(`${enemy.name}的攻击力提升了！`);
                    break;
                case 'shield':
                    enemy.buffedDefense = (enemy.buffedDefense || 0) + 15;
                    this.addBattleLog(`${enemy.name}的防御力提升了！`);
                    break;
                case 'heal':
                    const healAmount = special.value || 50;
                    enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + healAmount);
                    this.updateEnemyHpBar();
                    this.addBattleLog(`${enemy.name}恢复了${healAmount}HP！`);
                    break;
                case 'fullheal':
                    enemy.currentHp = enemy.maxHp;
                    this.updateEnemyHpBar();
                    this.addBattleLog(`${enemy.name}完全恢复了！`);
                    break;
                case 'paralyze':
                    if (special.chance && Math.random() < special.chance) {
                        this.addBattleLog(`你被麻痹了！下回合无法行动！`);
                        // TODO: 实现麻痹效果
                    }
                    break;
            }
        }
    }

    battleVictory() {
        const enemy = this.currentEnemy;
        const isBoss = enemy.isBoss || enemy.type === 'boss';
        const exp = enemy.exp || 20;
        const gold = enemy.gold || 10;

        // 幸运戒指加成
        const goldBonus = this.player.equipment.accessory?.stats?.goldBonus || 0;
        const totalGold = Math.floor(gold * (1 + goldBonus));

        this.player.exp += exp;
        this.player.gold += totalGold;

        if (isBoss) {
            this.addBattleLog(`🎉 BOSS击破！！！`);
            this.addBattleLog(`获得 ${exp} 经验和 ${totalGold} 金币！`);

            // BOSS击败奖励：永久属性提升
            const statBonus = enemy.isChapterBoss ? 5 : 3;
            this.player.attack += statBonus;
            this.player.defense += Math.floor(statBonus / 2);
            this.player.maxHp += statBonus * 5;
            this.player.hp = Math.min(this.player.hp + statBonus * 5, this.player.maxHp);
            this.addBattleLog(`击败BOSS！攻击+${statBonus}，防御+${Math.floor(statBonus / 2)}，最大HP+${statBonus * 5}！`);

            // Track defeated boss for open world
            if (!this.defeatedBosses.includes(enemy.id)) {
                this.defeatedBosses.push(enemy.id);

                // Reduce world pollution when boss is defeated
                if (CHAPTERS[this.state.chapter]?.mapType === 'openWorld') {
                    const pollutionReduction = enemy.isFinalBoss ? 40 : 20;
                    this.worldPollution = Math.max(0, this.worldPollution - pollutionReduction);
                    this.addMessage(`🌿 世界污染度降低了 ${pollutionReduction}%！当前: ${this.worldPollution}%`, "system");

                    // Check if world is purified
                    if (this.worldPollution <= 0) {
                        this.addMessage("🎊 世界已被完全净化！", "system");
                    }

                    // Unlock sanctuary portal message
                    const requiredBosses = [501, 502, 503];
                    const allDefeated = requiredBosses.every(id => this.defeatedBosses.includes(id));
                    if (allDefeated && !this.defeatedBosses.includes(504)) {
                        this.addMessage("✨ 净化圣所的传送门已经开启！", "system");
                    }
                }
            }

            // 最终BOSS特殊消息
            if (enemy.isFinalBoss) {
                this.addMessage("🏆 恭喜！你击败了最终BOSS！", "system");
                if (this.worldPollution <= 0) {
                    this.victory();
                    return;
                }
            } else if (enemy.isChapterBoss) {
                this.addMessage("👑 章节BOSS已被击败！前方的道路已经打开！", "system");
            } else {
                this.addMessage(`👑 BOSS ${enemy.name} 已被击败！`, "system");
            }
        } else {
            this.addBattleLog(`胜利！获得 ${exp} 经验和 ${totalGold} 金币！`);

            // Reduce world pollution slightly when defeating enemies in open world
            if (CHAPTERS[this.state.chapter]?.mapType === 'openWorld' && this.worldPollution > 0) {
                const pollutionReduction = Math.max(1, Math.floor(exp / 20));
                this.worldPollution = Math.max(0, this.worldPollution - pollutionReduction);
                if (pollutionReduction > 0) {
                    this.addBattleLog(`🌿 世界污染度-${pollutionReduction}%`);
                }
            }
        }

        // 升级检查
        while (this.player.exp >= this.player.expToNext) {
            this.player.exp -= this.player.expToNext;
            this.player.level++;
            this.player.maxHp += 15;
            this.player.hp = Math.min(this.player.hp + 15, this.player.maxHp);
            this.player.attack += 3;
            this.player.defense += 2;
            this.player.expToNext = Math.floor(this.player.expToNext * 1.3);
            this.addBattleLog(`升级！现在是 Lv.${this.player.level}！`);
            this.addMessage(`升级到 Lv.${this.player.level}！`, "system");
        }

        // 移除敌人
        this.entities = this.entities.filter(e => e !== this.currentEnemy);

        setTimeout(() => this.endBattle(true), isBoss ? 2000 : 1000);
    }

    playerDefeated() {
        // 检查复活种子
        const reviverIdx = this.player.inventory.findIndex(item => item.id === 'reviver');

        if (reviverIdx !== -1) {
            this.player.inventory.splice(reviverIdx, 1);
            this.player.hp = Math.floor(this.player.maxHp * 0.5);
            this.addBattleLog("复活种子发动！恢复了一半HP！");
            this.updatePlayerStats();
            this.updateInventoryUI();
        } else {
            this.addBattleLog("你被击败了...");
            setTimeout(() => {
                this.endBattle(false);
                this.gameOver();
            }, 1000);
        }
    }

    endBattle(victory) {
        this.state.inBattle = false;
        this.currentEnemy = null;
        document.getElementById('battle-overlay').classList.add('hidden');
        this.updatePlayerStats();
    }

    // ==================== 商店系统 ====================

    openShop(shopkeeper) {
        this.state.inShop = true;
        this.currentNPC = shopkeeper;

        const shopOverlay = document.getElementById('shop-overlay');
        shopOverlay.classList.remove('hidden');

        // 显示商店标题和台词
        const dialogue = shopkeeper.dialogues[Math.floor(Math.random() * shopkeeper.dialogues.length)];
        document.getElementById('shop-title').textContent = `${shopkeeper.emoji} ${shopkeeper.name}的商店`;
        this.addMessage(`${shopkeeper.name}: "${dialogue}"`, "dialog");

        // 生成商品列表
        const shopItemsDiv = document.getElementById('shop-items');
        shopItemsDiv.innerHTML = '';

        const availableItems = [...ALL_ITEMS, ...EQUIPMENT_DATA];
        const shopItems = [];

        // 从商店特定道具中选择
        if (shopkeeper.shopItems) {
            for (const itemId of shopkeeper.shopItems) {
                const item = availableItems.find(i => i.id === itemId);
                if (item) shopItems.push(item);
            }
        }

        // 添加一些随机道具
        for (let i = 0; i < 2; i++) {
            const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
            if (!shopItems.find(s => s.id === randomItem.id)) {
                shopItems.push(randomItem);
            }
        }

        for (const item of shopItems) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.emoji} ${item.name}</div>
                    <div class="shop-item-desc">${item.description}</div>
                </div>
                <span class="shop-item-price">${item.price} G</span>
                <button ${this.player.gold < item.price ? 'disabled' : ''}>购买</button>
            `;

            const btn = div.querySelector('button');
            btn.onclick = () => this.buyItem(item, btn);

            shopItemsDiv.appendChild(div);
        }

        document.getElementById('shop-close').onclick = () => this.closeShop();
    }

    buyItem(item, btn) {
        if (this.player.gold < item.price) {
            this.addMessage("金币不足！", "system");
            return;
        }

        if (this.player.inventory.length >= this.player.maxInventory) {
            this.addMessage("背包已满！", "system");
            return;
        }

        this.player.gold -= item.price;
        this.player.inventory.push({ ...item });
        this.addMessage(`购买了 ${item.emoji} ${item.name}！`, "item");
        this.updatePlayerStats();
        this.updateInventoryUI();

        // 更新按钮状态
        const buttons = document.querySelectorAll('.shop-item button');
        buttons.forEach(b => {
            const price = parseInt(b.previousElementSibling.textContent);
            if (this.player.gold < price) {
                b.disabled = true;
            }
        });
    }

    closeShop() {
        this.state.inShop = false;
        this.currentNPC = null;
        document.getElementById('shop-overlay').classList.add('hidden');
    }

    // ==================== 治疗者对话 ====================

    showHealerDialog(healer) {
        this.state.inDialog = true;
        this.currentNPC = healer;

        const dialogOverlay = document.getElementById('dialog-overlay');
        dialogOverlay.classList.remove('hidden');

        // 显示像素精灵
        const portraitCanvas = document.getElementById('dialog-portrait-canvas');
        const portraitCtx = portraitCanvas.getContext('2d');
        portraitCtx.clearRect(0, 0, 80, 80);

        const spriteData = POKEMON_SPRITES[healer.id];
        if (spriteData) {
            drawSprite(portraitCtx, spriteData, 0, 0, 80);
        }

        document.getElementById('dialog-name').textContent = healer.name;

        const dialogue = healer.dialogues[Math.floor(Math.random() * healer.dialogues.length)];
        document.getElementById('dialog-text').textContent = dialogue;

        const optionsDiv = document.getElementById('dialog-options');
        optionsDiv.innerHTML = '';

        // 治疗选项
        const healBtn = document.createElement('button');
        healBtn.textContent = '请帮我治疗';
        healBtn.onclick = () => {
            const healAmount = healer.healAmount || 0.5;
            const healed = Math.floor((this.player.maxHp - this.player.hp) * healAmount);

            if (healAmount >= 1) {
                this.player.hp = this.player.maxHp;
            } else {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + healed);
            }

            let msg = `${healer.name} 治愈了你！恢复了 ${healed} HP！`;

            // 净化师可以降低污染值
            if (healer.cleansePollution && this.player.pollution > 0) {
                this.player.pollution = Math.max(0, this.player.pollution - healer.cleansePollution);
                msg += ` 污染值-${healer.cleansePollution}`;
            }

            // 医生可以止血
            if (healer.stopBleeding && this.player.bleeding) {
                this.player.bleeding = false;
                this.player.bleedingTurns = 0;
                msg += ` 流血已止住！`;
            }

            this.addMessage(msg, "item");
            this.updatePlayerStats();
            this.closeDialog();
        };

        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = '离开';
        leaveBtn.onclick = () => this.closeDialog();

        optionsDiv.appendChild(healBtn);
        optionsDiv.appendChild(leaveBtn);
    }

    closeDialog() {
        this.state.inDialog = false;
        this.currentNPC = null;
        document.getElementById('dialog-overlay').classList.add('hidden');
    }

    // ==================== 道具系统 ====================

    pickupItem() {
        // Check for portal first
        const portal = this.getPortalAt(this.player.x, this.player.y);
        if (portal) {
            this.teleportToArea(portal);
            return;
        }

        const item = this.getItemAt(this.player.x, this.player.y);

        if (!item) {
            this.addMessage("这里没有道具。", "system");
            return;
        }

        if (this.player.inventory.length >= this.player.maxInventory) {
            this.addMessage("背包已满！", "system");
            return;
        }

        this.player.inventory.push({ ...item });
        this.items = this.items.filter(i => i.x !== item.x || i.y !== item.y);

        this.addMessage(`拾取了 ${item.emoji} ${item.name}！`, "item");
        this.updateInventoryUI();
    }

    useItem(item) {
        if (!item.effect) {
            // 装备
            if (item.slot) {
                this.equipItem(item);
            }
            return;
        }

        const effect = item.effect;

        switch (effect.type) {
            case 'heal':
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + effect.value);
                this.addMessage(`使用 ${item.name}，恢复了 ${effect.value} HP！`, "item");
                break;

            case 'fullHeal':
                this.player.hp = this.player.maxHp;
                this.addMessage(`使用 ${item.name}，HP完全恢复！`, "item");
                break;

            case 'buff':
                this.player.buffs[effect.stat] += effect.value;
                this.addMessage(`使用 ${item.name}，${effect.stat === 'attack' ? '攻击' : '防御'}力+${effect.value}！`, "item");
                break;

            case 'allBuff':
                this.player.buffs.attack += effect.value;
                this.player.buffs.defense += effect.value;
                this.addMessage(`使用 ${item.name}，攻击和防御各+${effect.value}！`, "item");
                break;

            case 'escape':
                this.addMessage("使用逃脱玉，传送到下一层！", "item");
                this.nextFloor();
                break;

            case 'permBuff':
                this.player[effect.stat] += effect.value;
                this.addMessage(`使用 ${item.name}，${effect.stat === 'attack' ? '攻击' : '防御'}永久+${effect.value}！`, "item");
                break;

            case 'cleanse':
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + (effect.heal || 0));
                this.addMessage(`使用 ${item.name}，状态清除并恢复${effect.heal}HP！`, "item");
                break;

            case 'throwDamage':
                if (this.state.inBattle && this.currentEnemy) {
                    this.currentEnemy.currentHp -= effect.value;
                    this.addBattleLog(`投掷 ${item.name}，造成 ${effect.value} 点伤害！`);
                    this.updateEnemyHpBar();
                    if (this.currentEnemy.currentHp <= 0) {
                        this.battleVictory();
                    }
                } else {
                    this.addMessage("投掷道具只能在战斗中使用！", "system");
                    return; // 不消耗道具
                }
                break;

            case 'revive':
                this.addMessage("复活种子会在你倒下时自动发动！", "system");
                return; // 不消耗

            // 第二章新道具效果
            case 'cleansePollution':
                this.player.pollution = Math.max(0, this.player.pollution - effect.value);
                this.addMessage(`使用 ${item.name}，污染值-${effect.value}！`, "item");
                break;

            case 'fullCleansePollution':
                this.player.pollution = 0;
                this.addMessage(`使用 ${item.name}，污染值完全清除！`, "item");
                break;

            case 'stopBleeding':
                this.player.bleeding = false;
                this.player.bleedingTurns = 0;
                if (effect.heal) {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + effect.heal);
                }
                this.addMessage(`使用 ${item.name}，止血成功！恢复${effect.heal || 0}HP`, "item");
                break;

            case 'antiZombie':
                if (this.state.inBattle && this.currentEnemy && this.currentEnemy.type === 'zombie') {
                    this.currentEnemy.currentHp -= effect.value;
                    this.addBattleLog(`圣水灼烧僵尸！造成 ${effect.value} 点伤害！`);
                    this.updateEnemyHpBar();
                    if (this.currentEnemy.currentHp <= 0) {
                        this.battleVictory();
                    }
                } else if (this.state.inBattle) {
                    this.addBattleLog(`圣水对非僵尸敌人无效！`);
                    return; // 不消耗
                } else {
                    this.addMessage("圣水只能在战斗中对僵尸使用！", "system");
                    return;
                }
                break;

            default:
                this.addMessage(`使用了 ${item.name}！`, "item");
        }

        // 移除消耗品
        const idx = this.player.inventory.indexOf(item);
        if (idx !== -1) {
            this.player.inventory.splice(idx, 1);
        }

        this.updatePlayerStats();
        this.updateInventoryUI();
    }

    equipItem(item) {
        const slot = item.slot;
        const oldItem = this.player.equipment[slot];

        // 卸下旧装备
        if (oldItem) {
            this.player.inventory.push(oldItem);
        }

        // 装备新道具
        this.player.equipment[slot] = item;

        // 从背包移除
        const idx = this.player.inventory.indexOf(item);
        if (idx !== -1) {
            this.player.inventory.splice(idx, 1);
        }

        this.addMessage(`装备了 ${item.emoji} ${item.name}！`, "item");
        this.updateEquipmentUI();
        this.updateInventoryUI();
        this.updatePlayerStats();
    }

    useQuickItem() {
        // 使用背包中第一个消耗品
        const consumable = this.player.inventory.find(item =>
            item.effect && item.effect.type !== 'revive');

        if (consumable) {
            this.useItem(consumable);
        } else {
            this.addMessage("没有可用的道具！", "system");
        }
    }

    // ==================== 楼层系统 ====================

    nextFloor() {
        const chapter = CHAPTERS[this.state.chapter];

        // 检查是否到达章节结束
        if (this.state.floor >= chapter.floors) {
            this.endChapter();
            return;
        }

        this.state.floor++;
        this.generateFloor();
    }

    endChapter() {
        const chapter = CHAPTERS[this.state.chapter];

        if (chapter.endStory) {
            this.showStory(chapter.endStory, () => {
                this.startNextChapter();
            });
        } else {
            this.startNextChapter();
        }
    }

    startNextChapter() {
        this.state.chapter++;
        this.state.floor = 1;

        if (!CHAPTERS[this.state.chapter]) {
            this.victory();
            return;
        }

        this.showChapterIntro();
        this.generateFloor();
    }

    // ==================== 游戏状态 ====================

    gameOver() {
        this.state.gameOver = true;

        const overlay = document.getElementById('gameover-overlay');
        overlay.classList.remove('hidden');

        document.getElementById('gameover-text').textContent =
            `你在第 ${this.state.floor} 层倒下了...\n等级: ${this.player.level} | 金币: ${this.player.gold}`;

        document.getElementById('restart-btn').onclick = () => location.reload();
    }

    victory() {
        this.state.gameOver = true;

        const overlay = document.getElementById('gameover-overlay');
        overlay.classList.remove('hidden');

        document.querySelector('#gameover-box h1').textContent = '通关！';
        document.querySelector('#gameover-box h1').style.color = '#6bcb77';
        document.getElementById('gameover-text').textContent =
            `恭喜通关！\n等级: ${this.player.level} | 金币: ${this.player.gold}`;

        document.getElementById('restart-btn').onclick = () => location.reload();
    }

    // ==================== UI更新 ====================

    updatePlayerStats() {
        const totalMaxHp = this.player.maxHp + (this.player.equipment.armor?.stats?.hp || 0);

        document.getElementById('hp-display').textContent = `HP: ${this.player.hp}/${totalMaxHp}`;
        document.getElementById('level-display').textContent = `Lv: ${this.player.level}`;
        document.getElementById('exp-display').textContent = `EXP: ${this.player.exp}/${this.player.expToNext}`;
        document.getElementById('gold-display').textContent = `金币: ${this.player.gold}`;

        // 章节显示
        const chapter = CHAPTERS[this.state.chapter];
        document.getElementById('chapter-display').textContent = chapter ? chapter.name.split('：')[0] : '';

        // 楼层/区域显示
        if (chapter?.mapType === 'openWorld') {
            const area = OPEN_WORLD_AREAS[this.currentArea];
            document.getElementById('floor-display').textContent = area ? area.name : '未知区域';
        } else {
            document.getElementById('floor-display').textContent = `楼层: ${this.state.floor}F`;
        }

        // 污染值显示（只在第二章显示）
        const pollutionContainer = document.getElementById('pollution-container');
        if (this.state.chapter >= 2) {
            pollutionContainer.classList.remove('hidden');
            const pollutionPercent = (this.player.pollution / this.player.maxPollution) * 100;
            document.getElementById('pollution-fill').style.width = `${pollutionPercent}%`;
            document.getElementById('pollution-value').textContent = `${this.player.pollution}/${this.player.maxPollution}`;
        } else {
            pollutionContainer.classList.add('hidden');
        }

        // 世界污染度显示（只在开放世界显示）
        const worldPollutionContainer = document.getElementById('world-pollution-container');
        if (chapter?.mapType === 'openWorld') {
            worldPollutionContainer.classList.remove('hidden');
            document.getElementById('world-pollution-fill').style.width = `${this.worldPollution}%`;
            document.getElementById('world-pollution-value').textContent = `${this.worldPollution}%`;
        } else {
            worldPollutionContainer.classList.add('hidden');
        }

        // 流血状态显示
        const bleedingStatus = document.getElementById('bleeding-status');
        if (this.player.bleeding) {
            bleedingStatus.classList.remove('hidden');
            bleedingStatus.textContent = `🩸流血(${this.player.bleedingTurns})`;
        } else {
            bleedingStatus.classList.add('hidden');
        }
    }

    updateInventoryUI() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';

        document.getElementById('inventory-count').textContent =
            `${this.player.inventory.length}/${this.player.maxInventory}`;

        for (const item of this.player.inventory) {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <span>${item.emoji} ${item.name}</span>
                <span>使用</span>
            `;
            div.onclick = () => this.useItem(item);
            list.appendChild(div);
        }
    }

    updateEquipmentUI() {
        const slots = document.querySelectorAll('.equip-slot');

        slots.forEach(slot => {
            const slotType = slot.dataset.slot;
            const item = this.player.equipment[slotType];

            if (item) {
                slot.textContent = `${slotType === 'weapon' ? '武器' : slotType === 'armor' ? '护甲' : '饰品'}: ${item.emoji} ${item.name}`;
            } else {
                slot.textContent = `${slotType === 'weapon' ? '武器' : slotType === 'armor' ? '护甲' : '饰品'}: 无`;
            }
        });
    }

    addMessage(text, type = "system") {
        const messages = document.getElementById('messages');
        const div = document.createElement('div');
        div.className = `msg-${type}`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        // 保持消息数量合理
        while (messages.children.length > 50) {
            messages.removeChild(messages.firstChild);
        }
    }

    // ==================== 辅助方法 ====================

    getEntityAt(x, y) {
        return this.entities.find(e => e.x === x && e.y === y);
    }

    getItemAt(x, y) {
        return this.items.find(i => i.x === x && i.y === y);
    }

    // ==================== 控制 ====================

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.state.gameOver) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.movePlayer(1, 0);
                    break;
                case ' ':
                    e.preventDefault();
                    this.pickupItem();
                    break;
                case 'z':
                case 'Z':
                    e.preventDefault();
                    this.attackNearby();
                    break;
                case 'q':
                case 'Q':
                    e.preventDefault();
                    this.useQuickItem();
                    break;
                case 'Escape':
                    if (this.state.inShop) this.closeShop();
                    if (this.state.inDialog) this.closeDialog();
                    break;
            }
        });
    }

    attackNearby() {
        // 攻击相邻的敌人
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        const hostileTypes = ['hostile', 'zombie', 'polluted', 'boss'];

        for (const [dx, dy] of directions) {
            const entity = this.getEntityAt(this.player.x + dx, this.player.y + dy);
            if (entity && hostileTypes.includes(entity.type)) {
                this.startBattle(entity);
                return;
            }
        }

        this.addMessage("周围没有敌人。", "system");
    }

    setupMobileControls() {
        // 创建移动控制按钮
        const controls = document.createElement('div');
        controls.id = 'mobile-controls';

        const updateControlsLayout = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const isTablet = screenWidth >= 600 && screenWidth <= 1024;
            const isLandscape = screenWidth > screenHeight;
            const isPhoneLandscape = screenWidth < 900 && screenHeight < 500 && isLandscape;

            if (isTablet || isPhoneLandscape) {
                // Tablet/Landscape layout: D-pad left, actions right
                controls.innerHTML = `
                    <div class="tablet-controls">
                        <div class="dpad-container">
                            <div class="control-row">
                                <button class="ctrl-btn" data-dir="up">↑</button>
                            </div>
                            <div class="control-row">
                                <button class="ctrl-btn" data-dir="left">←</button>
                                <button class="ctrl-btn" data-dir="right">→</button>
                            </div>
                            <div class="control-row">
                                <button class="ctrl-btn" data-dir="down">↓</button>
                            </div>
                        </div>
                        <div class="action-container">
                            <div class="control-row">
                                <button class="ctrl-btn action" data-action="attack">攻击</button>
                                <button class="ctrl-btn action" data-action="item">道具</button>
                            </div>
                            <div class="control-row">
                                <button class="ctrl-btn action" data-action="pickup">拾取</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Phone portrait layout: centered stacked
                controls.innerHTML = `
                    <div class="phone-controls">
                        <div class="control-row">
                            <button class="ctrl-btn" data-dir="up">↑</button>
                        </div>
                        <div class="control-row">
                            <button class="ctrl-btn" data-dir="left">←</button>
                            <button class="ctrl-btn action" data-action="pickup">拾取</button>
                            <button class="ctrl-btn" data-dir="right">→</button>
                        </div>
                        <div class="control-row">
                            <button class="ctrl-btn" data-dir="down">↓</button>
                        </div>
                        <div class="control-row action-row">
                            <button class="ctrl-btn action" data-action="attack">攻击</button>
                            <button class="ctrl-btn action" data-action="item">道具</button>
                        </div>
                    </div>
                `;
            }
            // Rebind events after layout change
            bindControlEvents();
        };

        const bindControlEvents = () => {
            // 移动按钮
            const dirButtons = controls.querySelectorAll('[data-dir]');
            dirButtons.forEach(btn => {
                const handleMove = () => {
                    const dir = btn.dataset.dir;
                    switch (dir) {
                        case 'up': this.movePlayer(0, -1); break;
                        case 'down': this.movePlayer(0, 1); break;
                        case 'left': this.movePlayer(-1, 0); break;
                        case 'right': this.movePlayer(1, 0); break;
                    }
                };

                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    handleMove();
                }, { passive: false });
                btn.addEventListener('click', handleMove);
            });

            // 动作按钮
            const actionButtons = controls.querySelectorAll('[data-action]');
            actionButtons.forEach(btn => {
                const handleAction = () => {
                    const action = btn.dataset.action;
                    switch (action) {
                        case 'pickup': this.pickupItem(); break;
                        case 'attack': this.attackNearby(); break;
                        case 'item': this.useQuickItem(); break;
                    }
                };

                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    handleAction();
                }, { passive: false });
                btn.addEventListener('click', handleAction);
            });
        };

        document.body.appendChild(controls);
        updateControlsLayout();

        // Update layout on orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(updateControlsLayout, 150);
        });
        window.addEventListener('resize', () => {
            // Debounce resize to avoid too many updates
            clearTimeout(this._resizeControlsTimeout);
            this._resizeControlsTimeout = setTimeout(updateControlsLayout, 100);
        });

        // 触摸滑动控制 (swipe on canvas)
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            const threshold = 30;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > threshold) this.movePlayer(1, 0);
                else if (dx < -threshold) this.movePlayer(-1, 0);
            } else {
                if (dy > threshold) this.movePlayer(0, 1);
                else if (dy < -threshold) this.movePlayer(0, -1);
            }
        });
    }

    // ==================== 渲染 ====================

    gameLoop() {
        this.render();
        this.renderMinimap();
        requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        const ctx = this.ctx;
        const tileSize = this.config.tileSize;

        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 计算视口偏移
        const offsetX = Math.floor(this.canvas.width / 2) - this.player.x * tileSize;
        const offsetY = Math.floor(this.canvas.height / 2) - this.player.y * tileSize;

        // 绘制地图
        for (let y = 0; y < this.config.mazeHeight; y++) {
            for (let x = 0; x < this.config.mazeWidth; x++) {
                const screenX = x * tileSize + offsetX;
                const screenY = y * tileSize + offsetY;

                // 视口裁剪
                if (screenX < -tileSize || screenX > this.canvas.width ||
                    screenY < -tileSize || screenY > this.canvas.height) {
                    continue;
                }

                // 未探索区域显示为黑色
                if (!this.explored[y][x]) {
                    ctx.fillStyle = '#0a0a15';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                    continue;
                }

                // 绘制地板或墙
                if (this.maze[y][x] === 0) {
                    ctx.fillStyle = '#1a1a35';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);

                    // 地板纹理
                    ctx.strokeStyle = '#252550';
                    ctx.strokeRect(screenX, screenY, tileSize, tileSize);
                } else {
                    ctx.fillStyle = '#2a2a4a';
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);

                    // 墙壁阴影效果
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(screenX + 3, screenY + 3, tileSize - 3, tileSize - 3);
                }
            }
        }

        // 绘制楼梯
        if (this.stairsPos && this.explored[this.stairsPos.y][this.stairsPos.x]) {
            const sx = this.stairsPos.x * tileSize + offsetX;
            const sy = this.stairsPos.y * tileSize + offsetY;

            ctx.fillStyle = '#4ecdc4';
            ctx.font = `${tileSize - 8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚪', sx + tileSize / 2, sy + tileSize / 2);
        }

        // 绘制传送门
        for (const portal of this.portals) {
            if (!this.explored[portal.y][portal.x]) continue;

            const px = portal.x * tileSize + offsetX;
            const py = portal.y * tileSize + offsetY;

            // Portal glow effect
            const gradient = ctx.createRadialGradient(
                px + tileSize / 2, py + tileSize / 2, 0,
                px + tileSize / 2, py + tileSize / 2, tileSize / 2
            );
            gradient.addColorStop(0, portal.color || '#a855f7');
            gradient.addColorStop(0.5, portal.color ? portal.color + '80' : '#a855f780');
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2 + 4, 0, Math.PI * 2);
            ctx.fill();

            // Portal icon
            ctx.font = `${tileSize - 6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(portal.emoji, px + tileSize / 2, py + tileSize / 2);
        }

        // 绘制道具
        for (const item of this.items) {
            if (!this.explored[item.y][item.x]) continue;

            const ix = item.x * tileSize + offsetX;
            const iy = item.y * tileSize + offsetY;

            ctx.font = `${tileSize - 12}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji, ix + tileSize / 2, iy + tileSize / 2);
        }

        // 绘制宝可梦
        for (const entity of this.entities) {
            if (!this.explored[entity.y][entity.x]) continue;

            const ex = entity.x * tileSize + offsetX;
            const ey = entity.y * tileSize + offsetY;

            // 背景圆圈表示类型
            ctx.beginPath();
            ctx.arc(ex + tileSize / 2, ey + tileSize / 2, tileSize / 2 - 2, 0, Math.PI * 2);

            if (entity.type === 'shop') {
                ctx.fillStyle = 'rgba(107, 203, 119, 0.4)';
            } else if (entity.type === 'healer') {
                ctx.fillStyle = 'rgba(255, 107, 157, 0.4)';
            } else if (entity.behavior === 'runner') {
                ctx.fillStyle = 'rgba(255, 217, 61, 0.4)';
            } else {
                ctx.fillStyle = 'rgba(255, 107, 107, 0.4)';
            }
            ctx.fill();

            // 绘制像素精灵
            const spriteData = POKEMON_SPRITES[entity.id];
            if (spriteData) {
                // 使用缓存的精灵
                const cachedSprite = getCachedSprite(entity.id, tileSize - 4);
                if (cachedSprite) {
                    ctx.drawImage(cachedSprite, ex + 2, ey + 2);
                } else {
                    drawSprite(ctx, spriteData, ex + 2, ey + 2, tileSize - 4);
                }
            } else {
                // 回退到emoji
                ctx.font = `${tileSize - 10}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(entity.emoji, ex + tileSize / 2, ey + tileSize / 2);
            }
        }

        // 绘制玩家（火柴人）
        this.drawStickman(
            this.player.x * tileSize + offsetX + tileSize / 2,
            this.player.y * tileSize + offsetY + tileSize / 2,
            tileSize - 8
        );
    }

    drawStickman(x, y, size) {
        const ctx = this.ctx;
        const scale = size / 30;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = 'round';

        // 头
        ctx.beginPath();
        ctx.arc(x, y - 8 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.stroke();

        // 身体
        ctx.beginPath();
        ctx.moveTo(x, y - 3 * scale);
        ctx.lineTo(x, y + 8 * scale);
        ctx.stroke();

        // 手臂
        ctx.beginPath();
        ctx.moveTo(x - 8 * scale, y);
        ctx.lineTo(x + 8 * scale, y);
        ctx.stroke();

        // 腿
        ctx.beginPath();
        ctx.moveTo(x, y + 8 * scale);
        ctx.lineTo(x - 6 * scale, y + 15 * scale);
        ctx.moveTo(x, y + 8 * scale);
        ctx.lineTo(x + 6 * scale, y + 15 * scale);
        ctx.stroke();

        // 如果有武器，绘制剑
        if (this.player.equipment.weapon) {
            ctx.strokeStyle = '#ffd93d';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(x + 8 * scale, y);
            ctx.lineTo(x + 15 * scale, y - 8 * scale);
            ctx.stroke();
        }
    }

    renderMinimap() {
        const ctx = this.minimapCtx;
        const scale = Math.min(
            this.minimapCanvas.width / this.config.mazeWidth,
            this.minimapCanvas.height / this.config.mazeHeight
        );

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

        // 绘制迷宫
        for (let y = 0; y < this.config.mazeHeight; y++) {
            for (let x = 0; x < this.config.mazeWidth; x++) {
                if (!this.explored[y][x]) continue;

                if (this.maze[y][x] === 0) {
                    ctx.fillStyle = '#3a3a5a';
                } else {
                    ctx.fillStyle = '#2a2a4a';
                }
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        // 绘制楼梯
        if (this.stairsPos && this.explored[this.stairsPos.y][this.stairsPos.x]) {
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(this.stairsPos.x * scale, this.stairsPos.y * scale, scale, scale);
        }

        // 绘制传送门
        for (const portal of this.portals) {
            if (!this.explored[portal.y][portal.x]) continue;
            ctx.fillStyle = portal.color || '#a855f7';
            ctx.fillRect(portal.x * scale, portal.y * scale, scale + 1, scale + 1);
        }

        // 绘制宝可梦
        for (const entity of this.entities) {
            if (!this.explored[entity.y][entity.x]) continue;

            if (entity.type === 'shop') {
                ctx.fillStyle = '#6bcb77';
            } else if (entity.type === 'healer') {
                ctx.fillStyle = '#ff6b9d';
            } else {
                ctx.fillStyle = '#ff6b6b';
            }
            ctx.fillRect(entity.x * scale, entity.y * scale, scale, scale);
        }

        // 绘制玩家
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.player.x * scale - 1, this.player.y * scale - 1, scale + 2, scale + 2);
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new Game();
});

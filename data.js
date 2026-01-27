// ==================== 宝可梦数据 (30种) ====================

const POKEMON_DATA = [
    // === 敌对宝可梦 (18种) ===
    {
        id: 1, name: "皮卡丘", emoji: "⚡", type: "hostile",
        hp: 35, attack: 15, defense: 8, exp: 25, gold: 10,
        behavior: "aggressive",
        dialogues: [
            "皮卡！皮卡丘！",
            "感受电击的力量吧！",
            "你敢挑战我？",
            "电光一闪！"
        ]
    },
    {
        id: 2, name: "小火龙", emoji: "🔥", type: "hostile",
        hp: 40, attack: 18, defense: 6, exp: 30, gold: 12,
        behavior: "aggressive",
        dialogues: [
            "呼...火焰在燃烧！",
            "小心被烫到！",
            "我的尾巴火焰从不熄灭！",
            "来尝尝火焰的味道！"
        ]
    },
    {
        id: 3, name: "杰尼龟", emoji: "🐢", type: "hostile",
        hp: 45, attack: 12, defense: 12, exp: 25, gold: 10,
        behavior: "aggressive",
        dialogues: [
            "杰尼~杰尼龟！",
            "水炮准备！",
            "我的壳可是很硬的！",
            "水之力量！"
        ]
    },
    {
        id: 4, name: "妙蛙种子", emoji: "🌱", type: "hostile",
        hp: 50, attack: 14, defense: 10, exp: 28, gold: 11,
        behavior: "aggressive",
        dialogues: [
            "妙蛙~",
            "藤鞭攻击！",
            "大自然的力量！",
            "叶子们，攻击！"
        ]
    },
    {
        id: 5, name: "小拳石", emoji: "🪨", type: "hostile",
        hp: 60, attack: 20, defense: 18, exp: 35, gold: 15,
        behavior: "aggressive",
        dialogues: [
            "咕噜咕噜...",
            "我是不可撼动的岩石！",
            "滚动攻击！",
            "你撞不动我的！"
        ]
    },
    {
        id: 6, name: "超音蝠", emoji: "🦇", type: "hostile",
        hp: 30, attack: 14, defense: 5, exp: 20, gold: 8,
        behavior: "aggressive",
        dialogues: [
            "吱吱吱...",
            "超声波攻击！",
            "黑暗中的猎手！",
            "听到我的声音了吗？"
        ]
    },
    {
        id: 7, name: "喵喵", emoji: "🐱", type: "hostile",
        hp: 35, attack: 16, defense: 7, exp: 22, gold: 20,
        behavior: "aggressive",
        dialogues: [
            "喵~喵~",
            "闪闪发光的东西是我的！",
            "招财猫攻击！",
            "把金币交出来！"
        ]
    },
    {
        id: 8, name: "鬼斯", emoji: "👻", type: "hostile",
        hp: 28, attack: 22, defense: 4, exp: 30, gold: 14,
        behavior: "aggressive",
        dialogues: [
            "嘿嘿嘿...",
            "你能抓住影子吗？",
            "催眠术！",
            "幽灵的诅咒！"
        ]
    },
    {
        id: 9, name: "小磁怪", emoji: "🧲", type: "hostile",
        hp: 32, attack: 17, defense: 14, exp: 26, gold: 12,
        behavior: "aggressive",
        dialogues: [
            "滋滋滋...",
            "电磁波攻击！",
            "金属音！",
            "极性反转！"
        ]
    },
    {
        id: 10, name: "大舌头", emoji: "👅", type: "hostile",
        hp: 55, attack: 15, defense: 10, exp: 32, gold: 13,
        behavior: "aggressive",
        dialogues: [
            "舔舔舔...",
            "被我舔到会麻痹的哦~",
            "我的舌头有两米长！",
            "尝起来怎么样？"
        ]
    },
    {
        id: 11, name: "臭泥", emoji: "🟣", type: "hostile",
        hp: 48, attack: 19, defense: 9, exp: 28, gold: 11,
        behavior: "aggressive",
        dialogues: [
            "咕噜咕噜...",
            "污泥攻击！",
            "我的味道很特别吧？",
            "臭气熏天！"
        ]
    },
    {
        id: 12, name: "穿山鼠", emoji: "🐭", type: "hostile",
        hp: 42, attack: 16, defense: 11, exp: 24, gold: 10,
        behavior: "aggressive",
        dialogues: [
            "嗖嗖嗖！",
            "挖洞攻击！",
            "我的爪子可锋利了！",
            "劈斩！"
        ]
    },
    // === 逃跑型宝可梦 (5种) ===
    {
        id: 13, name: "可达鸭", emoji: "🦆", type: "hostile",
        hp: 38, attack: 13, defense: 7, exp: 40, gold: 25,
        behavior: "runner",
        dialogues: [
            "鸭...头好痛...",
            "嘎？！不要过来！",
            "我要逃走了！",
            "头痛让我跑得更快！"
        ]
    },
    {
        id: 14, name: "百变怪", emoji: "🫠", type: "hostile",
        hp: 35, attack: 14, defense: 6, exp: 50, gold: 30,
        behavior: "runner",
        dialogues: [
            "咦？被发现了？",
            "变身失败...快逃！",
            "下次一定骗到你！",
            "我会变成别的东西的！"
        ]
    },
    {
        id: 15, name: "拉达", emoji: "🐀", type: "hostile",
        hp: 30, attack: 20, defense: 5, exp: 35, gold: 22,
        behavior: "runner",
        dialogues: [
            "吱吱！危险！",
            "跑得快才能活！",
            "我可是逃跑专家！",
            "追不上我的！"
        ]
    },
    {
        id: 16, name: "波波", emoji: "🐦", type: "hostile",
        hp: 25, attack: 12, defense: 4, exp: 18, gold: 8,
        behavior: "runner",
        dialogues: [
            "叽叽喳喳！",
            "飞走咯~",
            "你抓不到我！",
            "天空才是我的家！"
        ]
    },
    {
        id: 17, name: "绿毛虫", emoji: "🐛", type: "hostile",
        hp: 20, attack: 8, defense: 3, exp: 15, gold: 5,
        behavior: "runner",
        dialogues: [
            "咕噜咕噜...",
            "不要踩到我！",
            "我只是想变成蝴蝶！",
            "吐丝逃跑！"
        ]
    },
    // === 更多敌对宝可梦 ===
    {
        id: 18, name: "卡蒂狗", emoji: "🐕", type: "hostile",
        hp: 45, attack: 22, defense: 10, exp: 35, gold: 16,
        behavior: "aggressive",
        dialogues: [
            "汪汪汪！",
            "火焰獠牙！",
            "我是忠诚的守护者！",
            "别想从这里通过！"
        ]
    },
    {
        id: 19, name: "腕力", emoji: "💪", type: "hostile",
        hp: 55, attack: 25, defense: 8, exp: 38, gold: 18,
        behavior: "aggressive",
        dialogues: [
            "嘿呦！嘿呦！",
            "看看我的肌肉！",
            "地球投！",
            "力量就是一切！"
        ]
    },
    {
        id: 20, name: "催眠貘", emoji: "🐘", type: "hostile",
        hp: 50, attack: 18, defense: 12, exp: 40, gold: 20,
        behavior: "aggressive",
        dialogues: [
            "你很困了...",
            "让我吃掉你的梦！",
            "催眠术！睡吧...",
            "做个好梦~"
        ]
    },
    // === 商店宝可梦 (5种) ===
    {
        id: 21, name: "波克比", emoji: "🥚", type: "shop",
        dialogues: [
            "欢迎来到波克比商店！",
            "今天有什么需要的吗？",
            "这些都是我精心挑选的好货哦~",
            "幸运蛋特价中！",
            "祝你冒险顺利！"
        ],
        shopItems: ["potion", "superPotion", "escapeOrb", "apple"]
    },
    {
        id: 22, name: "胖丁", emoji: "🎀", type: "shop",
        dialogues: [
            "欢迎光临~胖丁商店！",
            "要听我唱歌吗？啊不对，要买东西吗？",
            "今天有特价商品哦！",
            "我的商品可是最好的！",
            "谢谢惠顾，下次再来~"
        ],
        shopItems: ["potion", "reviver", "maxElixir", "banana"]
    },
    {
        id: 23, name: "皮皮", emoji: "🌙", type: "shop",
        dialogues: [
            "月光商店欢迎你！",
            "这些可是月光下收集的宝物~",
            "需要什么尽管说！",
            "满月时商品更便宜哦~",
            "皮皮会保佑你的！"
        ],
        shopItems: ["xAttack", "xDefense", "maxPotion", "gravelyrock"]
    },
    {
        id: 24, name: "伊布", emoji: "🦊", type: "shop",
        dialogues: [
            "伊布商店！应有尽有！",
            "我可是进化专家~有什么需要？",
            "这些道具我亲自试过，很有效！",
            "买一送一？...开玩笑的！",
            "期待你的下次光临！"
        ],
        shopItems: ["superPotion", "allPowerUp", "escapeOrb", "oran"]
    },
    {
        id: 25, name: "迷你龙", emoji: "🐉", type: "shop",
        dialogues: [
            "神秘的龙之商店...",
            "这里有稀有的宝物...",
            "传说中的道具...要看看吗？",
            "价格有点贵...但物超所值！",
            "龙之祝福与你同在..."
        ],
        shopItems: ["maxPotion", "reviver", "allPowerUp", "dragonScale"]
    },
    // === 治疗宝可梦 (5种) ===
    {
        id: 26, name: "吉利蛋", emoji: "🩷", type: "healer",
        dialogues: [
            "你受伤了！让我帮你治疗~",
            "吉利蛋的蛋能治愈一切！",
            "休息一下吧，我来照顾你！",
            "健康是最重要的！",
            "感觉好多了吧？继续加油！"
        ],
        healAmount: 1.0 // 完全恢复
    },
    {
        id: 27, name: "拉鲁拉丝", emoji: "💚", type: "healer",
        dialogues: [
            "我感受到了你的疲惫...",
            "让我用念力治愈你~",
            "心灵的力量能治愈伤痛！",
            "请安心，交给我！",
            "愿和平与你同在！"
        ],
        healAmount: 0.6
    },
    {
        id: 28, name: "葉精靈", emoji: "🌿", type: "healer",
        dialogues: [
            "自然之力在召唤~",
            "森林的祝福给予你！",
            "光合作用...治愈！",
            "绿色能量注入！",
            "大自然会保护你的！"
        ],
        healAmount: 0.5
    },
    {
        id: 29, name: "太阳精灵", emoji: "☀️", type: "healer",
        dialogues: [
            "太阳的光辉照耀你！",
            "温暖的能量...治愈~",
            "阳光治疗术！",
            "光明永远驱散黑暗！",
            "带着光明继续前进吧！"
        ],
        healAmount: 0.7
    },
    {
        id: 30, name: "幸福蛋", emoji: "💗", type: "healer",
        dialogues: [
            "幸福的力量最强大！",
            "让我完全治愈你！",
            "幸福蛋的祝福~完全恢复！",
            "开心才能变强！",
            "满血复活！继续冒险吧！"
        ],
        healAmount: 1.0
    }
];

// ==================== 道具数据 (10种) ====================

const ITEMS_DATA = [
    {
        id: "potion",
        name: "伤药",
        emoji: "🧴",
        type: "consumable",
        description: "恢复30点HP",
        effect: { type: "heal", value: 30 },
        price: 50,
        rarity: 1
    },
    {
        id: "superPotion",
        name: "超级伤药",
        emoji: "💊",
        type: "consumable",
        description: "恢复60点HP",
        effect: { type: "heal", value: 60 },
        price: 100,
        rarity: 2
    },
    {
        id: "maxPotion",
        name: "全满药",
        emoji: "💉",
        type: "consumable",
        description: "完全恢复HP",
        effect: { type: "fullHeal" },
        price: 200,
        rarity: 3
    },
    {
        id: "reviver",
        name: "复活种子",
        emoji: "🌰",
        type: "consumable",
        description: "濒死时自动复活并恢复50%HP",
        effect: { type: "revive", value: 0.5 },
        price: 300,
        rarity: 4
    },
    {
        id: "escapeOrb",
        name: "逃脱玉",
        emoji: "🔮",
        type: "consumable",
        description: "立即传送到下一层",
        effect: { type: "escape" },
        price: 150,
        rarity: 2
    },
    {
        id: "xAttack",
        name: "攻击强化",
        emoji: "⚔️",
        type: "consumable",
        description: "本层攻击力+10",
        effect: { type: "buff", stat: "attack", value: 10 },
        price: 80,
        rarity: 2
    },
    {
        id: "xDefense",
        name: "防御强化",
        emoji: "🛡️",
        type: "consumable",
        description: "本层防御力+10",
        effect: { type: "buff", stat: "defense", value: 10 },
        price: 80,
        rarity: 2
    },
    {
        id: "allPowerUp",
        name: "全能力强化",
        emoji: "✨",
        type: "consumable",
        description: "攻击和防御各+8",
        effect: { type: "allBuff", value: 8 },
        price: 150,
        rarity: 3
    },
    {
        id: "apple",
        name: "苹果",
        emoji: "🍎",
        type: "consumable",
        description: "恢复20点HP，美味可口",
        effect: { type: "heal", value: 20 },
        price: 30,
        rarity: 1
    },
    {
        id: "maxElixir",
        name: "万能药",
        emoji: "🧪",
        type: "consumable",
        description: "解除所有负面状态并恢复40HP",
        effect: { type: "cleanse", heal: 40 },
        price: 120,
        rarity: 3
    }
];

// ==================== 装备数据 (5种) ====================

const EQUIPMENT_DATA = [
    {
        id: "woodenSword",
        name: "木剑",
        emoji: "🗡️",
        type: "weapon",
        slot: "weapon",
        description: "普通的木制剑",
        stats: { attack: 5 },
        price: 100,
        rarity: 1
    },
    {
        id: "ironSword",
        name: "铁剑",
        emoji: "⚔️",
        type: "weapon",
        slot: "weapon",
        description: "锋利的铁制剑",
        stats: { attack: 12 },
        price: 250,
        rarity: 2
    },
    {
        id: "leatherArmor",
        name: "皮甲",
        emoji: "🥋",
        type: "armor",
        slot: "armor",
        description: "轻便的皮革护甲",
        stats: { defense: 5, hp: 10 },
        price: 120,
        rarity: 1
    },
    {
        id: "ironArmor",
        name: "铁甲",
        emoji: "🛡️",
        type: "armor",
        slot: "armor",
        description: "坚固的铁制护甲",
        stats: { defense: 12, hp: 25 },
        price: 280,
        rarity: 2
    },
    {
        id: "luckyRing",
        name: "幸运戒指",
        emoji: "💍",
        type: "accessory",
        slot: "accessory",
        description: "增加金币掉落和道具发现率",
        stats: { luck: 10, goldBonus: 0.2 },
        price: 350,
        rarity: 3
    }
];

// ==================== 额外道具（可在地牢中找到）====================

const DUNGEON_ITEMS = [
    {
        id: "oran",
        name: "橙橙果",
        emoji: "🍊",
        type: "consumable",
        description: "恢复35点HP",
        effect: { type: "heal", value: 35 },
        price: 40,
        rarity: 1
    },
    {
        id: "banana",
        name: "香蕉",
        emoji: "🍌",
        type: "consumable",
        description: "恢复25点HP",
        effect: { type: "heal", value: 25 },
        price: 25,
        rarity: 1
    },
    {
        id: "gravelyrock",
        name: "投掷石",
        emoji: "🪨",
        type: "consumable",
        description: "投掷造成20点伤害",
        effect: { type: "throwDamage", value: 20 },
        price: 20,
        rarity: 1
    },
    {
        id: "dragonScale",
        name: "龙之鳞片",
        emoji: "🐲",
        type: "consumable",
        description: "永久增加5点防御",
        effect: { type: "permBuff", stat: "defense", value: 5 },
        price: 500,
        rarity: 5
    }
];

// 合并所有道具
const ALL_ITEMS = [...ITEMS_DATA, ...DUNGEON_ITEMS];

// ==================== 随机台词生成器 ====================

const RANDOM_DIALOGUE_PARTS = {
    greetings: [
        "喂！", "嘿！", "哼！", "嗯？", "啊！", "呀！", "哦？", "诶~"
    ],
    threats: [
        "你找死！", "受死吧！", "来战斗！", "不准通过！", "这是我的地盘！",
        "你会后悔的！", "放马过来！", "我不会手下留情！"
    ],
    scared: [
        "不不不！", "救命啊！", "我要逃了！", "别过来！", "太可怕了！",
        "我跑不动了...", "求你放过我！", "我只是路过的！"
    ],
    friendly: [
        "你好呀~", "需要帮助吗？", "冒险者你好！", "欢迎欢迎~",
        "有什么需要的？", "请随意看看~", "祝你好运！"
    ],
    exclamations: [
        "！", "！！", "~", "...", "?!", "~!", "...!"
    ]
};

function generateRandomDialogue(type) {
    const parts = RANDOM_DIALOGUE_PARTS;
    let dialogue = "";

    switch(type) {
        case "hostile":
            dialogue = parts.greetings[Math.floor(Math.random() * parts.greetings.length)] +
                      parts.threats[Math.floor(Math.random() * parts.threats.length)];
            break;
        case "runner":
            dialogue = parts.scared[Math.floor(Math.random() * parts.scared.length)];
            break;
        case "shop":
        case "healer":
            dialogue = parts.friendly[Math.floor(Math.random() * parts.friendly.length)];
            break;
        default:
            dialogue = parts.greetings[Math.floor(Math.random() * parts.greetings.length)];
    }

    return dialogue;
}

// ==================== 章节系统 ====================

const CHAPTERS = {
    1: {
        name: "第一章：地宫探索",
        description: "你是一个火柴人，醒来时发现自己在一个神秘的地宫中...",
        floors: 50,
        endStory: [
            "终于...找到出口了！",
            "你推开沉重的石门，刺眼的光芒让你暂时失明...",
            "当你睁开眼睛时，你看到的景象让你震惊...",
            "整个世界...都被污染了！",
            "天空是灰紫色的，空气中弥漫着诡异的雾气...",
            "远处的城市已经成为废墟，到处都是被污染的宝可梦...",
            "还有...僵尸！",
            "你握紧拳头，暗下决心：",
            "「我要净化这个世界！」"
        ],
        mapType: "dungeon"
    },
    2: {
        name: "第二章：污染荒野",
        description: "地面世界已被污染，你必须找到净化之源...",
        floors: 100,
        endStory: [
            "恭喜你净化了荒野！",
            "但这只是开始..."
        ],
        mapType: "surface"
    }
};

// ==================== 僵尸数据 ====================

const ZOMBIE_DATA = [
    {
        id: 101, name: "普通僵尸", emoji: "🧟", type: "zombie",
        hp: 60, attack: 25, defense: 5, exp: 45, gold: 20,
        behavior: "aggressive",
        bleedChance: 0.25,
        dialogues: [
            "嗯...啊...",
            "肉...要吃肉...",
            "加入我们...",
            "脑子...好饿..."
        ]
    },
    {
        id: 102, name: "狂暴僵尸", emoji: "🧟‍♂️", type: "zombie",
        hp: 80, attack: 35, defense: 8, exp: 60, gold: 30,
        behavior: "aggressive",
        bleedChance: 0.35,
        dialogues: [
            "啊啊啊啊！！",
            "撕碎你！",
            "杀杀杀！",
            "血...更多的血！"
        ]
    },
    {
        id: 103, name: "腐烂僵尸", emoji: "🦠", type: "zombie",
        hp: 50, attack: 20, defense: 3, exp: 40, gold: 15,
        behavior: "aggressive",
        bleedChance: 0.20,
        pollutionDamage: 10,
        dialogues: [
            "咕噜噜...",
            "腐烂...扩散...",
            "污染...一切...",
            "加入腐烂..."
        ]
    },
    {
        id: 104, name: "巨型僵尸", emoji: "👹", type: "zombie",
        hp: 150, attack: 45, defense: 15, exp: 100, gold: 50,
        behavior: "aggressive",
        bleedChance: 0.40,
        dialogues: [
            "吼！！！",
            "碾碎！",
            "小虫子...",
            "无处可逃！"
        ]
    },
    {
        id: 105, name: "幽灵僵尸", emoji: "👻", type: "zombie",
        hp: 40, attack: 30, defense: 2, exp: 55, gold: 25,
        behavior: "aggressive",
        bleedChance: 0.15,
        dialogues: [
            "嘻嘻嘻...",
            "看不见我...",
            "已经死过一次了...",
            "来陪我吧..."
        ]
    }
];

// ==================== 污染宝可梦数据 ====================

const POLLUTED_POKEMON_DATA = [
    {
        id: 201, name: "污染皮卡丘", emoji: "⚡", type: "polluted",
        hp: 50, attack: 25, defense: 12, exp: 40, gold: 20,
        behavior: "aggressive",
        pollutionDamage: 8,
        dialogues: [
            "皮...卡...痛苦...",
            "救...救我...",
            "污染...好痛...",
            "杀了我...求你..."
        ]
    },
    {
        id: 202, name: "污染小火龙", emoji: "🔥", type: "polluted",
        hp: 55, attack: 28, defense: 10, exp: 45, gold: 22,
        behavior: "aggressive",
        pollutionDamage: 10,
        dialogues: [
            "火焰...变成黑色了...",
            "好冷...明明在燃烧...",
            "污染的火焰...",
            "净化我..."
        ]
    },
    {
        id: 203, name: "污染杰尼龟", emoji: "🐢", type: "polluted",
        hp: 60, attack: 22, defense: 18, exp: 42, gold: 18,
        behavior: "aggressive",
        pollutionDamage: 7,
        dialogues: [
            "水...都是毒...",
            "壳裂开了...",
            "杰尼...不想这样...",
            "污水...好苦..."
        ]
    },
    {
        id: 204, name: "污染妙蛙种子", emoji: "🌱", type: "polluted",
        hp: 65, attack: 24, defense: 14, exp: 44, gold: 20,
        behavior: "aggressive",
        pollutionDamage: 12,
        dialogues: [
            "花...枯萎了...",
            "种子在腐烂...",
            "大自然...被玷污了...",
            "毒藤...控制不住..."
        ]
    },
    {
        id: 205, name: "污染鬼斯", emoji: "👻", type: "polluted",
        hp: 45, attack: 35, defense: 6, exp: 50, gold: 25,
        behavior: "aggressive",
        pollutionDamage: 15,
        dialogues: [
            "双重死亡...",
            "污染让我更强...",
            "嘿嘿...加入黑暗...",
            "诅咒...污染..."
        ]
    },
    {
        id: 206, name: "污染超音蝠", emoji: "🦇", type: "polluted",
        hp: 40, attack: 22, defense: 8, exp: 35, gold: 15,
        behavior: "aggressive",
        pollutionDamage: 6,
        dialogues: [
            "吱...吱...",
            "翅膀...好重...",
            "看不见了...",
            "污染的超声波..."
        ]
    },
    {
        id: 207, name: "污染臭泥", emoji: "🟣", type: "polluted",
        hp: 70, attack: 30, defense: 12, exp: 55, gold: 28,
        behavior: "aggressive",
        pollutionDamage: 20,
        dialogues: [
            "更臭了...更毒了...",
            "污染是美味的...",
            "吸收污染...",
            "融化一切..."
        ]
    },
    {
        id: 208, name: "污染腕力", emoji: "💪", type: "polluted",
        hp: 80, attack: 40, defense: 12, exp: 60, gold: 30,
        behavior: "aggressive",
        pollutionDamage: 9,
        dialogues: [
            "力量...失控...",
            "肌肉在溶解...",
            "好痛...但更强了...",
            "污染之力！"
        ]
    }
];

// ==================== 第二章新道具 ====================

const CHAPTER2_ITEMS = [
    {
        id: "antidote",
        name: "净化药剂",
        emoji: "💧",
        type: "consumable",
        description: "降低30点污染值",
        effect: { type: "cleansePollution", value: 30 },
        price: 100,
        rarity: 2
    },
    {
        id: "purifyOrb",
        name: "净化之珠",
        emoji: "🔵",
        type: "consumable",
        description: "完全清除污染值",
        effect: { type: "fullCleansePollution" },
        price: 300,
        rarity: 4
    },
    {
        id: "bandage",
        name: "绷带",
        emoji: "🩹",
        type: "consumable",
        description: "止血并恢复20HP",
        effect: { type: "stopBleeding", heal: 20 },
        price: 60,
        rarity: 1
    },
    {
        id: "gasMask",
        name: "防毒面具",
        emoji: "😷",
        type: "equipment",
        slot: "accessory",
        description: "减少50%污染伤害",
        stats: { pollutionResist: 0.5 },
        price: 400,
        rarity: 3
    },
    {
        id: "holyWater",
        name: "圣水",
        emoji: "✨",
        type: "consumable",
        description: "对僵尸造成100点伤害",
        effect: { type: "antiZombie", value: 100 },
        price: 150,
        rarity: 3
    },
    {
        id: "purifiedSword",
        name: "净化之剑",
        emoji: "🗡️",
        type: "equipment",
        slot: "weapon",
        description: "对污染敌人伤害+50%",
        stats: { attack: 15, pollutionBonus: 0.5 },
        price: 500,
        rarity: 4
    }
];

// ==================== 地面世界治疗者 ====================

const SURFACE_HEALERS = [
    {
        id: 301, name: "净化师", emoji: "🧙", type: "healer",
        dialogues: [
            "我能感受到你体内的污染...",
            "让我帮你净化！",
            "净化之光！",
            "污染是可以被驱除的！",
            "坚持住，你做得很好！"
        ],
        healAmount: 0.8,
        cleansePollution: 20
    },
    {
        id: 302, name: "幸存医生", emoji: "👨‍⚕️", type: "healer",
        dialogues: [
            "我是末日前的医生...",
            "让我检查一下你的伤口",
            "止血很重要！",
            "这个世界还有希望！",
            "你是我见过最勇敢的人！"
        ],
        healAmount: 1.0,
        stopBleeding: true
    }
];

// ==================== 导出数据 ====================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        POKEMON_DATA,
        ITEMS_DATA,
        EQUIPMENT_DATA,
        ALL_ITEMS,
        DUNGEON_ITEMS,
        CHAPTERS,
        ZOMBIE_DATA,
        POLLUTED_POKEMON_DATA,
        CHAPTER2_ITEMS,
        SURFACE_HEALERS,
        generateRandomDialogue
    };
}

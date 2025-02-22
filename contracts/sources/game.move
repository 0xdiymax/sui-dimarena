module dimarena::game {
    use std::hash::sha2_256;
    use std::string::String;
    use std::string;
    use sui::clock;
    use sui::clock::Clock;
    use sui::event::emit;
    use sui::table;
    use sui::table::{Table};
    use sui::transfer::{public_transfer, share_object};
    use sui::url;
    use sui::url::Url;

    // ======== Constants ========
    const MAX_ATTACK_DEFEND_STRENGTH : u64 = 10;

    const MAX_HEATH : u64 = 10;

    const BATTLE_STATUS_PENDDING : u64 = 0;
    const BATTLE_STATUS_START : u64 = 1;
    const BATTLE_STATUS_END : u64 = 2;

    const CHOICE_ATTACH : u64 = 1;
    const CHOICE_DEFENSE: u64 = 2;

    // ======== Errors =========
    const EBattleNotPending: u64 = 1;
    const EBattleNotStarted: u64 = 2;
    const EChoiceNotAllowed: u64 = 3;
    const ENotPlayer: u64 = 4;

    const EWaitFor: u64 = 5;

    const EEmptyBattleName: u64 = 7;

    // 战斗结果枚举常量
    const BATTLE_RESULT_ONGOING: u8 = 0;
    const BATTLE_RESULT_P1_WIN: u8 = 1; 
    const BATTLE_RESULT_P2_WIN: u8 = 2;

    public struct BattleRecord has key,store {
        id: UID,
        battles: vector<ID>,
    }

    public struct CardRecord has key,store {
        id: UID,
        cards: vector<ID>,
    }

    public struct PlayerStatus  has store {
        health: u64,
    }

    public struct Card has key,store {
        id: UID,
        attack: u64,
        defense: u64,
        name: String,
        description: String,
        url: Url,
        template_id: u64,
        created_at: u64,
    }

    public struct Battle has key,store {
        id: UID,
        name: String,
        status: u64,
        cards: Table<address, Card>,
        players: vector<address>,
        player_status: Table<address, PlayerStatus>,
        moves: Table<address, u64>,
        winer: Option<address>,
    }

    // ======== Events =========
    // new battle
    public struct NewBattle has copy,drop {
        id:ID,
    }
    // join battle
    public struct JoinBattle has copy,drop {
        id: ID,
    }
    // choice
    public struct MoveChoice has copy,drop {
        battld_id: ID,
        choice: u64,
    }
    // battle end
    public struct BattleEnd has copy,drop {
        battld_id: ID,
        winer: Option<address>,
        loser: Option<address>,
    }
    // cancel battle
    public struct BattleCancel has copy,drop {
        battld_id: ID,
    }

    // NFT模板结构体
    public struct NFTTemplate has store, copy, drop {
        template_id: u64,
        name: String,
        description: String,
        url: Url,
    }

    // NFT模板存储
    public struct NFTTemplates has key {
        id: UID,
        templates: vector<NFTTemplate>
    }

    // NFT铸造事件
    public struct NFTMinted has copy, drop {
        object_id: ID,
        creator: address,
        name: String,
        template_id: u64,
        attack: u64,
        defense: u64,
    }

    fun init(ctx: &mut TxContext) {
        let battle_record = BattleRecord {
            id: object::new(ctx),
            battles: vector::empty<ID>(),
        };
        let card_record = CardRecord {
            id: object::new(ctx),
            cards: vector::empty<ID>(),
        };

        let mut templates = vector::empty<NFTTemplate>();
        
        let template_names = vector[
            b"Sakura Kinomoto",
            b"Hatsune Miku",
            b"Monkey D. Luffy",
            b"Naruto Uzumaki",
            b"Mikoto Misaka",
            b"Rem",
            b"Akame",
            b"Artoria Pendragon",
            b"Kirito",
            b"Asuna",
            b"Ken Kaneki",
            b"Zero Two"
        ];
        
        let template_descriptions = vector[
            b"A magical girl wielding the Sealing Staff, master of the Star Cards",
            b"Virtual singer from the future, her voice heals hearts",
            b"Rubber Devil Fruit user, aspiring to become the Pirate King",
            b"Ninja of Hidden Leaf Village, Nine-Tails Jinchuriki",
            b"The strongest Electromaster, Level 5 Esper of Academy City",
            b"Devoted maid from Re:Zero, wields powerful ice magic",
            b"Elite assassin wielding the cursed sword Murasame",
            b"The King of Knights, wielder of the holy sword Excalibur",
            b"The Black Swordsman, dual-wielding master from SAO",
            b"Lightning Flash, vice commander of Knights of Blood",
            b"Half-human half-ghoul, the One-Eyed King",
            b"Elite pilot known as the Partner Killer from Squad 13"
        ];
        
        let template_urls = vector[
            b"https://img.maxdiy10.com/card1.jpg",
            b"https://img.maxdiy10.com/card2.jpg",
            b"https://img.maxdiy10.com/card3.jpg",
            b"https://img.maxdiy10.com/card4.jpg",
            b"https://img.maxdiy10.com/card5.jpg",
            b"https://img.maxdiy10.com/card6.jpg",
            b"https://img.maxdiy10.com/card7.jpg",
            b"https://img.maxdiy10.com/card8.jpg",
            b"https://img.maxdiy10.com/card9.jpg",
            b"https://img.maxdiy10.com/card10.jpg",
            b"https://img.maxdiy10.com/card11.jpg",
            b"https://img.maxdiy10.com/card12.jpg",
        ];

        let mut i = 0;
        let len = vector::length(&template_names);
        while (i < len) {
            let name = *vector::borrow(&template_names, i);
            let description = *vector::borrow(&template_descriptions, i);
            let url = *vector::borrow(&template_urls, i);
            
            vector::push_back(&mut templates, NFTTemplate {
                template_id: i,
                name: string::utf8(name),
                description: string::utf8(description),
                url: url::new_unsafe_from_bytes(url)
            });
            i = i + 1;
        };

        // 创建并共享模板存储
        let nft_templates = NFTTemplates {
            id: object::new(ctx),
            templates
        };
        transfer::share_object(nft_templates);

        share_object(battle_record);
        share_object(card_record)
    }

    public entry fun cancel_battle(battle: &mut Battle, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        assert!(battle.status == BATTLE_STATUS_PENDDING, EBattleNotPending);

        let card = table::remove(&mut battle.cards, sender);
        // let _ = table::remove(&mut battle.player_status, sender);
        battle.status = BATTLE_STATUS_END;

        emit(BattleCancel{
            battld_id: object::uid_to_inner(&battle.id),
        });
        public_transfer(card, sender)
    }

    public fun mint_card(
        templates: &NFTTemplates,
        clock: &Clock,
        ctx: &mut TxContext
    ) : Card {
        let (attack, defense) = random_strength_clock(clock);
        
        // 获取实际的模板数量
        let template_count = vector::length(&templates.templates);
        // 确保索引在有效范围内
        let template_index = (clock::timestamp_ms(clock) % (template_count as u64));
        let template = vector::borrow(&templates.templates, template_index);
        
        Card {
            id: object::new(ctx),
            attack,
            defense,
            name: template.name,
            description: template.description,
            url: template.url,
            template_id: template.template_id,
            created_at: clock::timestamp_ms(clock),
        }
    }

    public entry fun create_card(
        card_record: &mut CardRecord,
        templates: &NFTTemplates, 
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let card = mint_card(templates, clock, ctx);
        
        vector::push_back(&mut card_record.cards, object::uid_to_inner(&card.id));
        
        emit(NFTMinted {
            object_id: object::uid_to_inner(&card.id),
            creator: sender,
            name: card.name,
            template_id: card.template_id,
            attack: card.attack,
            defense: card.defense,
        });
        
        public_transfer(card, sender)
    }

    public entry fun create_battle(battle_record: &mut BattleRecord, name: vector<u8>, card: Card,ctx: &mut TxContext) {
        let battle_name = string::utf8(name);
        assert!(!string::is_empty(&battle_name), EEmptyBattleName);

        let sender = tx_context::sender(ctx);
        let mut cards = table::new<address, Card>(ctx);
        table::add(&mut cards, sender, card);
        let mut players = vector::empty<address>();
        vector::push_back(&mut players, sender);
        let mut player_status = table::new<address,PlayerStatus>(ctx);
        table::add(&mut player_status, sender, PlayerStatus{
            health: MAX_HEATH,
        });

        let battle = Battle {
            id: object::new(ctx),
            name:battle_name,
            status: BATTLE_STATUS_PENDDING,
            cards,
            players,
            player_status,
            moves: table::new(ctx),
            winer: option::none(),
        };

        vector::push_back(&mut battle_record.battles, object::uid_to_inner(&battle.id));
        emit(NewBattle{
            id: object::uid_to_inner(&battle.id),
        });
        share_object(battle)
    }

    public entry fun join_battle(card: Card, battle:&mut Battle, ctx: &mut TxContext) {
        assert!(battle.status == BATTLE_STATUS_PENDDING, EBattleNotPending);
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&battle.player_status, sender), ENotPlayer);

        table::add(&mut battle.cards, sender, card);
        vector::push_back(&mut battle.players, sender);
        table::add(&mut battle.player_status, sender, PlayerStatus{
            health:MAX_HEATH,
        });
        battle.status = BATTLE_STATUS_START;

        emit(JoinBattle{
            id: object::uid_to_inner(&battle.id),
        })
    }

    public entry fun move_choice(choice: u64, battle: &mut Battle, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        assert!(choice == CHOICE_ATTACH || choice == CHOICE_DEFENSE, EChoiceNotAllowed);
        assert!(battle.status == BATTLE_STATUS_START,EBattleNotStarted);
        // move once
        assert!(!table::contains(&battle.moves, sender), EWaitFor);
       
        table::add(&mut battle.moves, sender, choice);

        emit(MoveChoice{
            choice,
            battld_id: object::uid_to_inner(&battle.id),
        });

        if (table::length(&battle.moves) == 2) {
            execute_battle_round(battle, ctx)
        }
    }

    fun random_strength_clock(clock: &Clock) :(u64, u64){
        let ms = clock::timestamp_ms(clock);
        let mut random_attack = ms % MAX_ATTACK_DEFEND_STRENGTH;
        if (random_attack == 0) {
            random_attack = MAX_ATTACK_DEFEND_STRENGTH / 2;
        };

        (random_attack, MAX_ATTACK_DEFEND_STRENGTH - random_attack)
    }

    fun execute_battle_round(battle: &mut Battle, ctx: &TxContext) {
        // 获取玩家地址
        let p1 = *vector::borrow(&battle.players, 0);
        let p2 = *vector::borrow(&battle.players, 1);

        // 获取玩家卡牌信息
        let p1_card = table::borrow(&battle.cards, p1);
        let p2_card = table::borrow(&battle.cards, p2);

        // 获取玩家状态
        let mut p1_status = table::remove(&mut battle.player_status, p1);
        let mut p2_status = table::remove(&mut battle.player_status, p2);

        // 获取玩家行动选择
        let p1_move = table::remove(&mut battle.moves, p1);
        let p2_move = table::remove(&mut battle.moves, p2);

        // 计算战斗结果
        let battle_result = calculate_battle_result(
            p1_move, p2_move,
            p1_card, p2_card,
            &mut p1_status, &mut p2_status
        );

        // 处理战斗结果
        handle_battle_result(
            battle,
            battle_result,
            p1, p2,
            p1_status,
            p2_status,
            ctx
        );
    }

    // 计算战斗结果
    fun calculate_battle_result(
        p1_move: u64, 
        p2_move: u64,
        p1_card: &Card,
        p2_card: &Card, 
        p1_status: &mut PlayerStatus,
        p2_status: &mut PlayerStatus
    ): u8 {
        // 双方都选择攻击
        if (p1_move == CHOICE_ATTACH && p2_move == CHOICE_ATTACH) {
            if (p1_status.health <= p2_card.attack) {
                p1_status.health = 0;
                return BATTLE_RESULT_P2_WIN
            } else if (p2_status.health <= p1_card.attack) {
                p2_status.health = 0;
                return BATTLE_RESULT_P1_WIN
            } else {
                p1_status.health = p1_status.health - p2_card.attack;
                p2_status.health = p2_status.health - p1_card.attack;
            }
        } 
        // P1攻击,P2防守
        else if (p1_move == CHOICE_ATTACH && p2_move == CHOICE_DEFENSE) {
            let p2_total_health = p2_status.health + p2_card.defense;
            if (p1_card.attack >= p2_total_health) {
                p2_status.health = 0;
                return BATTLE_RESULT_P1_WIN
            } else if (p1_card.attack > p2_card.defense) {
                p2_status.health = p2_total_health - p1_card.attack;
            }
        }
        // P1防守,P2攻击 
        else if (p1_move == CHOICE_DEFENSE && p2_move == CHOICE_ATTACH) {
            let p1_total_health = p1_status.health + p1_card.defense;
            if (p2_card.attack >= p1_total_health) {
                p1_status.health = 0;
                return BATTLE_RESULT_P2_WIN
            } else if (p2_card.attack > p1_card.defense) {
                p1_status.health = p1_total_health - p2_card.attack;
            }
        };

        BATTLE_RESULT_ONGOING
    }

    // 处理战斗结果
    fun handle_battle_result(
        battle: &mut Battle,
        battle_result: u8,
        p1: address,
        p2: address,
        p1_status: PlayerStatus,
        p2_status: PlayerStatus,
        ctx: &TxContext
    ) {
        if (battle_result != BATTLE_RESULT_ONGOING) {
            // 战斗结束
            battle.status = BATTLE_STATUS_END;
            
            // 设置胜利者
            if (battle_result == BATTLE_RESULT_P1_WIN) {
                battle.winer = option::some(p1);
                let p1_card = table::borrow_mut(&mut battle.cards, p1);
                upgrade_winner_card(p1_card, ctx);
                emit(BattleEnd{
                    battld_id: object::uid_to_inner(&battle.id),
                    winer: option::some(p1),
                    loser: option::some(p2),
                });
            } else {
                battle.winer = option::some(p2);
                let p2_card = table::borrow_mut(&mut battle.cards, p2);
                upgrade_winner_card(p2_card, ctx);
                emit(BattleEnd{
                    battld_id: object::uid_to_inner(&battle.id),
                    winer: option::some(p2),
                    loser: option::some(p1),
                });
            };

            // 返还卡牌
            let p1_card = table::remove(&mut battle.cards, p1);
            let p2_card = table::remove(&mut battle.cards, p2);
            public_transfer(p1_card, p1);
            public_transfer(p2_card, p2);
            
            // 清理状态 - 通过解构来消耗 PlayerStatus
            let PlayerStatus { health: _ } = p1_status;
            let PlayerStatus { health: _ } = p2_status;
        } else {
            // 战斗继续 - 直接使用值而不是引用
            table::add(&mut battle.player_status, p1, p1_status);
            table::add(&mut battle.player_status, p2, p2_status);
        }
    }

    // 新增函数:升级胜利者的卡牌
    fun upgrade_winner_card(card: &mut Card, ctx: &TxContext) {
        let tx_digest = *tx_context::digest(ctx);
        let dig = sha2_256(tx_digest);
        let random = (dig[0] as u64) % 2; // 随机选择提升攻击力或防御力
        
        if (random == 0) {
            // 提升攻击力1点
            if (card.attack < MAX_ATTACK_DEFEND_STRENGTH) {
                card.attack = card.attack + 1;
            }
        } else {
            // 提升防御力1点
            if (card.defense < MAX_ATTACK_DEFEND_STRENGTH) {
                card.defense = card.defense + 1;
            }
        }
    }

    public fun name(card: &Card): &String {
        &card.name
    }

    public fun url(card: &Card): &Url {
        &card.url
    }
}

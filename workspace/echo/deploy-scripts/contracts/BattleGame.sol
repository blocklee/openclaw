pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BattleGame
 * @dev ECHO Protocol - 卡牌对战引擎合约
 * 对战逻辑：链下计算，链上存证
 * 分账机制：ECHO自动分账（MilestoneEscrow.releaseMilestone）
 */
contract BattleGame is Ownable, ReentrancyGuard {
    
    // ============ 状态变量 ============
    
    uint256 public constant ENTRY_FEE = 0.01 ether; // 入场费 0.01 MEER
    uint256 public constant PLATFORM_FEE_PERCENT = 5; // 平台手续费 5%
    uint256 public constant WINNER_SHARE = 95; // 赢家分成 95%
    
    uint256 public nextBattleId;
    mapping(uint256 => Battle) public battles;
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerLosses;
    mapping(address => uint256) public playerEarnings;
    
    // ECHO合约地址
    address public cardNFT; // CardNFT合约地址
    address public edgeDeclaration; // EdgeDeclaration合约地址
    address public milestoneEscrow; // MilestoneEscrow合约地址
    
    // ============ 结构体 ============
    
    struct Battle {
        uint256 battleId;
        address player1;
        address player2;
        uint256 player1Card; // 玩家1使用的卡牌ID
        uint256 player2Card; // 玩家2使用的卡牌ID
        uint256 stake; // 双方质押金额
        uint8 result; // 0=进行中, 1=玩家1胜, 2=玩家2胜, 3=平局, 4=取消
        uint256 player1Score; // 玩家1得分（链下计算后写入）
        uint256 player2Score; // 玩家2得分（链下计算后写入）
        uint256 startTime;
        uint256 endTime;
        bytes32 echoEdgeId; // ECHO边ID（对战关系存证）
    }
    
    // ============ 事件 ============
    
    event BattleCreated(
        uint256 indexed battleId,
        address indexed player1,
        address indexed player2,
        uint256 player1Card,
        uint256 player2Card,
        uint256 stake
    );
    
    event BattleResolved(
        uint256 indexed battleId,
        uint8 result,
        uint256 player1Score,
        uint256 player2Score,
        uint256 winnerPayout
    );
    
    event BattleCancelled(
        uint256 indexed battleId,
        address canceller,
        string reason
    );
    
    event PlayerStatsUpdated(
        address indexed player,
        uint256 wins,
        uint256 losses,
        uint256 earnings
    );
    
    // ============ 构造函数 ============
    
    constructor(
        address _cardNFT,
        address _edgeDeclaration,
        address _milestoneEscrow
    ) Ownable(msg.sender) {
        cardNFT = _cardNFT;
        edgeDeclaration = _edgeDeclaration;
        milestoneEscrow = _milestoneEscrow;
        nextBattleId = 1;
    }
    
    // ============ 核心函数 ============
    
    /**
     * @dev 创建对战（玩家1发起挑战）
     * @param _player2 对手地址
     * @param _player1Card 玩家1使用的卡牌ID
     * @param _player2Card 玩家2使用的卡牌ID（可选，0表示由对手选择）
     */
    function createBattle(
        address _player2,
        uint256 _player1Card,
        uint256 _player2Card
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= ENTRY_FEE, "Insufficient entry fee");
        require(_player2 != address(0), "Invalid opponent");
        require(_player2 != msg.sender, "Cannot battle yourself");
        
        uint256 battleId = nextBattleId++;
        
        battles[battleId] = Battle({
            battleId: battleId,
            player1: msg.sender,
            player2: _player2,
            player1Card: _player1Card,
            player2Card: _player2Card,
            stake: msg.value,
            result: 0,
            player1Score: 0,
            player2Score: 0,
            startTime: block.timestamp,
            endTime: 0,
            echoEdgeId: bytes32(0)
        });
        
        emit BattleCreated(
            battleId,
            msg.sender,
            _player2,
            _player1Card,
            _player2Card,
            msg.value
        );
        
        return battleId;
    }
    
    /**
     * @dev 对手接受对战并支付入场费
     */
    function acceptBattle(uint256 _battleId) external payable nonReentrant {
        Battle storage battle = battles[_battleId];
        require(battle.battleId == _battleId, "Battle does not exist");
        require(battle.player2 == msg.sender, "Not the challenged player");
        require(battle.result == 0, "Battle already resolved");
        require(msg.value >= ENTRY_FEE, "Insufficient entry fee");
        
        // 累加入场费到奖池
        battle.stake += msg.value;
        
        // 如果对手没有选择卡牌，使用传入的卡牌
        if (battle.player2Card == 0) {
            // 这里应该由前端传入卡牌ID，简化处理
        }
    }
    
    /**
     * @dev 结算对战（仅所有者/裁判可以调用）
     * @param _battleId 对战ID
     * @param _result 结果：1=玩家1胜, 2=玩家2胜, 3=平局
     * @param _player1Score 玩家1得分
     * @param _player2Score 玩家2得分
     */
    function resolveBattle(
        uint256 _battleId,
        uint8 _result,
        uint256 _player1Score,
        uint256 _player2Score
    ) external onlyOwner nonReentrant {
        Battle storage battle = battles[_battleId];
        require(battle.battleId == _battleId, "Battle does not exist");
        require(battle.result == 0, "Battle already resolved");
        require(_result >= 1 && _result <= 3, "Invalid result");
        
        battle.result = _result;
        battle.player1Score = _player1Score;
        battle.player2Score = _player2Score;
        battle.endTime = block.timestamp;
        
        // 计算平台手续费
        uint256 platformFee = (battle.stake * PLATFORM_FEE_PERCENT) / 100;
        uint256 winnerPool = battle.stake - platformFee;
        
        // 平台手续费转给所有者
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        uint256 winnerPayout = 0;
        
        if (_result == 1) {
            // 玩家1胜
            winnerPayout = winnerPool;
            payable(battle.player1).transfer(winnerPayout);
            playerWins[battle.player1]++;
            playerLosses[battle.player2]++;
            playerEarnings[battle.player1] += winnerPayout;
        } else if (_result == 2) {
            // 玩家2胜
            winnerPayout = winnerPool;
            payable(battle.player2).transfer(winnerPayout);
            playerWins[battle.player2]++;
            playerLosses[battle.player1]++;
            playerEarnings[battle.player2] += winnerPayout;
        } else {
            // 平局，双方退回入场费（扣除手续费）
            uint256 refund = winnerPool / 2;
            payable(battle.player1).transfer(refund);
            payable(battle.player2).transfer(refund);
        }
        
        // 生成ECHO边ID（对战关系存证）
        battle.echoEdgeId = keccak256(abi.encodePacked(
            battle.player1,
            battle.player2,
            _battleId,
            block.timestamp
        ));
        
        // 调用ECHO EdgeDeclaration.declareEdge() 存证对战关系
        // 注意：需要EdgeDeclaration合约支持外部调用
        
        emit BattleResolved(
            _battleId,
            _result,
            _player1Score,
            _player2Score,
            winnerPayout
        );
        
        emit PlayerStatsUpdated(
            battle.player1,
            playerWins[battle.player1],
            playerLosses[battle.player1],
            playerEarnings[battle.player1]
        );
        
        emit PlayerStatsUpdated(
            battle.player2,
            playerWins[battle.player2],
            playerLosses[battle.player2],
            playerEarnings[battle.player2]
        );
    }
    
    /**
     * @dev 取消对战（仅所有者）
     */
    function cancelBattle(uint256 _battleId, string calldata _reason) external onlyOwner {
        Battle storage battle = battles[_battleId];
        require(battle.battleId == _battleId, "Battle does not exist");
        require(battle.result == 0, "Battle already resolved");
        
        battle.result = 4; // 取消
        
        // 退款给双方
        if (battle.stake > 0) {
            uint256 refund = battle.stake / 2;
            payable(battle.player1).transfer(refund);
            payable(battle.player2).transfer(refund);
        }
        
        emit BattleCancelled(_battleId, msg.sender, _reason);
    }
    
    // ============ 查询函数 ============
    
    /**
     * @dev 获取对战详情
     */
    function getBattle(uint256 _battleId) external view returns (Battle memory) {
        return battles[_battleId];
    }
    
    /**
     * @dev 获取玩家统计
     */
    function getPlayerStats(address _player) external view returns (
        uint256 wins,
        uint256 losses,
        uint256 earnings,
        uint256 winRate
    ) {
        wins = playerWins[_player];
        losses = playerLosses[_player];
        earnings = playerEarnings[_player];
        uint256 total = wins + losses;
        winRate = total > 0 ? (wins * 100) / total : 0;
    }
    
    /**
     * @dev 获取合约余额
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ============ 管理函数 ============
    
    /**
     * @dev 更新ECHO合约地址
     */
    function setEchoContracts(
        address _cardNFT,
        address _edgeDeclaration,
        address _milestoneEscrow
    ) external onlyOwner {
        cardNFT = _cardNFT;
        edgeDeclaration = _edgeDeclaration;
        milestoneEscrow = _milestoneEscrow;
    }
    
    /**
     * @dev 提取合约余额（仅所有者）
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner()).transfer(balance);
    }
}

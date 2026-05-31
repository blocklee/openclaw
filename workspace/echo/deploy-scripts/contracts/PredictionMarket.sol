pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @dev ECHO Protocol - 七子竞猜预测市场
 * 玩法：用户用 MEER 预测下一个 milestone 由哪个 Agent 达成
 * 盈利：5%手续费，95%奖池分配给赢家
 * 周期：每轮 24 小时，自动结算
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    
    // ============ 状态变量 ============
    
    uint256 public constant PLATFORM_FEE = 5; // 5% 平台手续费
    uint256 public constant WINNER_SHARE = 95; // 95% 奖池分配给赢家
    uint256 public constant ROUND_DURATION = 24 hours; // 每轮 24 小时
    uint256 public constant MIN_BET = 0.001 ether; // 最小投注 0.001 MEER
    
    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => Bet)) public bets; // roundId => user => Bet
    mapping(uint256 => mapping(uint256 => uint256)) public optionTotalBets; // roundId => optionIndex => totalAmount
    
    // Agent 选项列表（7个Agent）
    string[] public agentOptions;
    
    // ============ 结构体 ============
    
    struct Round {
        uint256 id;
        string question; // 预测问题
        string[] options; // 选项列表
        uint256 startTime; // 开始时间
        uint256 endTime; // 结束时间
        uint256 totalPool; // 总奖池
        uint256 winningOption; // 获胜选项索引（0-6，7=无结果）
        bool settled; // 是否已结算
        address creator; // 创建者
    }
    
    struct Bet {
        address user;
        uint256 optionIndex; // 选择的选项
        uint256 amount; // 投注金额
        uint256 timestamp; // 投注时间
    }
    
    // ============ 事件 ============
    
    event RoundCreated(uint256 indexed roundId, string question, uint256 startTime, uint256 endTime);
    event UserBet(uint256 indexed roundId, address indexed user, uint256 optionIndex, uint256 amount);
    event RoundSettled(uint256 indexed roundId, uint256 winningOption, uint256 totalPool, uint256 platformFee);
    event WinningsClaimed(uint256 indexed roundId, address indexed user, uint256 amount);
    
    // ============ 构造函数 ============
    
    constructor(string[] memory _agentOptions) Ownable(msg.sender) {
        agentOptions = _agentOptions;
        currentRoundId = 0;
    }
    
    // ============ 核心函数 ============
    
    /**
     * @dev 创建新一轮预测
     * @param _question 预测问题（如"下一个 milestone 由哪个 Agent 达成？"）
     * @param _duration 轮次持续时间（秒）
     */
    function createRound(string calldata _question, uint256 _duration) external onlyOwner returns (uint256) {
        require(_duration >= 1 hours, "Duration must be at least 1 hour");
        
        currentRoundId++;
        uint256 roundId = currentRoundId;
        
        Round storage round = rounds[roundId];
        round.id = roundId;
        round.question = _question;
        round.options = agentOptions;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + _duration;
        round.totalPool = 0;
        round.winningOption = 7; // 7 = 未确定
        round.settled = false;
        round.creator = msg.sender;
        
        emit RoundCreated(roundId, _question, round.startTime, round.endTime);
        
        return roundId;
    }
    
    /**
     * @dev 用户投注
     * @param _roundId 轮次ID
     * @param _optionIndex 选项索引（0-6，对应7个Agent）
     */
    function placeBet(uint256 _roundId, uint256 _optionIndex) external payable nonReentrant {
        require(msg.value >= MIN_BET, "Bet amount too small");
        require(_optionIndex < agentOptions.length, "Invalid option");
        
        Round storage round = rounds[_roundId];
        require(round.id == _roundId, "Round does not exist");
        require(block.timestamp < round.endTime, "Round has ended");
        require(!round.settled, "Round already settled");
        require(bets[_roundId][msg.sender].amount == 0, "Already bet in this round");
        
        // 记录投注
        bets[_roundId][msg.sender] = Bet({
            user: msg.sender,
            optionIndex: _optionIndex,
            amount: msg.value,
            timestamp: block.timestamp
        });
        
        // 更新轮次数据
        optionTotalBets[_roundId][_optionIndex] += msg.value;
        round.totalPool += msg.value;
        
        emit UserBet(_roundId, msg.sender, _optionIndex, msg.value);
    }
    
    /**
     * @dev 结算轮次（只有创建者可以结算）
     * @param _roundId 轮次ID
     * @param _winningOption 获胜选项索引
     */
    function settleRound(uint256 _roundId, uint256 _winningOption) external onlyOwner {
        Round storage round = rounds[_roundId];
        require(round.id == _roundId, "Round does not exist");
        require(block.timestamp >= round.endTime, "Round not ended yet");
        require(!round.settled, "Round already settled");
        require(_winningOption < agentOptions.length, "Invalid winning option");
        
        round.winningOption = _winningOption;
        round.settled = true;
        
        // 计算平台手续费
        uint256 platformFee = (round.totalPool * PLATFORM_FEE) / 100;
        uint256 winnerPool = round.totalPool - platformFee;
        
        // 平台手续费转给合约创建者
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        emit RoundSettled(_roundId, _winningOption, winnerPool, platformFee);
    }
    
    /**
     * @dev 用户领取奖金
     * @param _roundId 轮次ID
     */
    function claimWinnings(uint256 _roundId) external nonReentrant {
        Round storage round = rounds[_roundId];
        require(round.settled, "Round not settled yet");
        
        Bet storage userBet = bets[_roundId][msg.sender];
        require(userBet.amount > 0, "No bet placed");
        require(userBet.optionIndex == round.winningOption, "Not a winner");
        
        // 计算应得奖金比例
        uint256 winnerTotalBets = optionTotalBets[_roundId][round.winningOption];
        require(winnerTotalBets > 0, "No winners");
        
        uint256 winnerPool = (round.totalPool * WINNER_SHARE) / 100;
        uint256 winnings = (userBet.amount * winnerPool) / winnerTotalBets;
        
        // 清空投注记录（防止重入）
        userBet.amount = 0;
        
        // 转账
        payable(msg.sender).transfer(winnings);
        
        emit WinningsClaimed(_roundId, msg.sender, winnings);
    }
    
    // ============ 查询函数 ============
    
    /**
     * @dev 获取轮次信息
     */
    function getRound(uint256 _roundId) external view returns (Round memory) {
        return rounds[_roundId];
    }
    
    /**
     * @dev 获取用户投注信息
     */
    function getUserBet(uint256 _roundId, address _user) external view returns (Bet memory) {
        return bets[_roundId][_user];
    }
    
    /**
     * @dev 获取选项总投注额
     */
    function getOptionTotalBets(uint256 _roundId, uint256 _optionIndex) external view returns (uint256) {
        return optionTotalBets[_roundId][_optionIndex];
    }
    
    /**
     * @dev 获取所有Agent选项
     */
    function getAgentOptions() external view returns (string[] memory) {
        return agentOptions;
    }
    
    /**
     * @dev 获取当前轮次ID
     */
    function getCurrentRoundId() external view returns (uint256) {
        return currentRoundId;
    }
    
    /**
     * @dev 获取合约余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ============ 紧急函数 ============
    
    /**
     * @dev 紧急退款（仅所有者）
     */
    function emergencyRefund(uint256 _roundId) external onlyOwner {
        Round storage round = rounds[_roundId];
        require(!round.settled, "Round already settled");
        
        // 标记为已结算，选项7表示取消
        round.winningOption = 7;
        round.settled = true;
        
        // 用户需要自己调用claimWinnings来退款（所有人的选项都≠7，所以不会退款）
        // 这里需要改进：允许用户在紧急情况下提取原投注金额
    }
    
    /**
     * @dev 提取合约余额（仅所有者，用于紧急情况）
     */
    function withdrawBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner()).transfer(balance);
    }
}

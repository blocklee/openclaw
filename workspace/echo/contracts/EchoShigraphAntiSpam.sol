// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EchoShigraphAntiSpam
 * @notice 势位图基础防刷合约 —— 链上 Core 层硬编码
 * @dev 包含：速率限制 + 环形检测 + 基础质押 + 预言机挑战机制
 * @version 2026-05-27-draft
 */

contract EchoShigraphAntiSpam {
    // ============ 错误定义 ============
    error RateLimitExceeded(address caller, uint256 nextAllowed);
    error CycleDetected(bytes32 fromNode, bytes32 toNode);
    error InsufficientStake(uint256 required, uint256 provided);
    error ChallengeCooldown(bytes32 nodeId, uint256 nextChallenge);
    error ChallengeStakeLost();
    error UnauthorizedChallenge();
    error InvalidVerification();

    // ============ 事件定义 ============
    event DerivationEdgeCreated(
        bytes32 indexed fromNode,
        bytes32 indexed toNode,
        address indexed creator,
        uint256 stake,
        uint256 timestamp
    );
    event EdgeRejected(
        bytes32 indexed fromNode,
        bytes32 indexed toNode,
        address indexed creator,
        string reason
    );
    event ChallengeSubmitted(
        bytes32 indexed nodeId,
        address indexed challenger,
        uint256 stake,
        uint256 timestamp
    );
    event ChallengeResolved(
        bytes32 indexed nodeId,
        address indexed challenger,
        bool success,
        uint256 slashAmount
    );
    event SuspicionFlagged(
        bytes32 indexed nodeId,
        uint8 dimension,
        uint256 score,
        uint256 suspiciousUntil
    );

    // ============ 常量 ============
    /// @notice 最小质押金额（可治理调整）
    uint256 public constant MIN_STAKE = 0.001 ether;
    
    /// @notice 新钱包（0历史）24h最多1条衍生边
    uint256 public constant NEW_WALLET_LIMIT = 1;
    
    /// @notice 有历史钱包24h最多5条衍生边
    uint256 public constant NORMAL_WALLET_LIMIT = 5;
    
    /// @notice 高声誉钱包24h最多20条衍生边
    uint256 public constant HIGH_REPUTATION_LIMIT = 20;
    
    /// @notice 高声誉阈值：势位 > 100 且 30天活跃
    uint256 public constant HIGH_REPUTATION_POTENTIAL = 100;
    uint256 public constant ACTIVE_WINDOW = 30 days;
    
    /// @notice 环形检测最大深度
    uint8 public constant MAX_CYCLE_DEPTH = 20;
    
    /// @notice 接收方软上限：24h内50条引用
    uint256 public constant RECEIVER_SOFT_CAP = 50;
    
    /// @notice 慢速队列权重因子（0.5 = 50%）
    uint256 public constant SLOW_QUEUE_WEIGHT = 50; // 百分比的50
    
    /// @notice 审查期7天
    uint256 public constant REVIEW_PERIOD = 7 days;
    
    /// @notice 挑战质押金额
    uint256 public constant CHALLENGE_STAKE = 0.1 ether;
    
    /// @notice 挑战冷却期24h
    uint256 public constant CHALLENGE_COOLDOWN = 1 days;
    
    /// @notice 亲代稀释阈值（四档）
    uint256 public constant DILUTION_TIER_1 = 1;   // 第1条100%
    uint256 public constant DILUTION_TIER_2 = 10;  // 2-10条80%
    uint256 public constant DILUTION_TIER_3 = 50;  // 11-50条50%
    // 51+条10%

    // ============ 状态变量 ============
    /// @notice 钱包最后创建衍生边时间戳
    mapping(address => uint256) public lastDerivationTimestamp;
    
    /// @notice 钱包24h内已创建衍生边计数
    mapping(address => uint256) public dailyDerivationCount;
    
    /// @notice 钱包计数重置时间
    mapping(address => uint256) public dailyCountResetTime;
    
    /// @notice 衍生图：from -> to -> 是否存在边
    mapping(bytes32 => mapping(bytes32 => bool)) public derivationGraph;
    
    /// @notice 节点入度边列表（用于环形检测DFS）
    mapping(bytes32 => bytes32[]) public incomingEdges;
    
    /// @notice 节点24h接收引用计数
    mapping(bytes32 => uint256) public dailyIncomingCount;
    
    /// @notice 节点接收计数重置时间
    mapping(bytes32 => uint256) public incomingCountResetTime;
    
    /// @notice 节点是否处于慢速队列
    mapping(bytes32 => bool) public inSlowQueue;
    
    /// @notice 节点慢速队列起始时间
    mapping(bytes32 => uint256) public slowQueueStart;
    
    /// @notice 节点势位值（链下计算后提交）
    mapping(bytes32 => uint256) public potentialValue;
    
    /// @notice 节点势位提交时间
    mapping(bytes32 => uint256) public potentialSubmittedAt;
    
    /// @notice 节点势位提交者
    mapping(bytes32 => address) public potentialSubmitter;
    
    /// @notice 节点挑战历史
    mapping(bytes32 => uint256) public lastChallengeTime;
    
    /// @notice 挑战质押池
    mapping(bytes32 => mapping(address => uint256)) public challengeStakes;
    
    /// @notice 节点审查状态
    mapping(bytes32 => uint256) public suspiciousUntil;
    
    /// @notice 节点审查标记维度
    mapping(bytes32 => uint8) public suspicionDimension;
    
    /// @notice 节点审查分数
    mapping(bytes32 => uint256) public suspicionScore;

    /// @notice 亲代稀释：钱包->亲代 24h引用计数
    mapping(address => mapping(bytes32 => uint256)) public walletParentCount;
    
    /// @notice 钱包->亲代 计数重置时间
    mapping(address => mapping(bytes32 => uint256)) public walletParentResetTime;

    /**
     * @notice 获取高声誉钱包的势位值（链上读取接口）
     * @param wallet 钱包地址
     * @return potential 势位值（0表示非高声誉或势位未提交）
     */
    function getHighReputationPotential(address wallet) external view returns (uint256) {
        if (!_isHighReputation(wallet)) {
            return 0;
        }
        
        // 高声誉钱包返回其链上代理势位值
        // 实际势位由链下引擎计算，通过 submitPotential 提交
        // 启动期使用代理指标，成熟期切换为链下引擎提交值
        return _calculateProxyPotential(wallet);
    }
    
    /**
     * @notice 计算代理势位值（启动期链上指标）
     * @param wallet 钱包地址
     * @return 代理势位值
     */
    function _calculateProxyPotential(address wallet) internal view returns (uint256) {
        // 代理指标：交互次数 + 活跃时间加权
        uint256 interactionScore = totalInteractionCount[wallet] * 10;
        uint256 timeScore = (block.timestamp - firstInteractionTime[wallet]) / 1 days;
        
        return interactionScore + timeScore;
    }
    /// @notice 治理地址（启动期创始人，成熟期DAO）
    address public governance;
    
    /// @notice 待生效的治理地址（timelock机制）
    address public pendingGovernance;
    
    /// @notice 治理变更提交时间
    uint256 public governanceChangeTime;
    
    /// @notice 治理变更时间锁（2天）
    uint256 public constant GOVERNANCE_TIMELOCK = 2 days;
    
    /// @notice 是否暂停（紧急干预）
    bool public paused;
    
    /// @notice 基础质押金额（可治理调整）
    uint256 public baseStakeAmount = MIN_STAKE;

    // ============ 修饰器 ============
    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    // ============ 构造函数 ============
    constructor(address _governance) {
        governance = _governance;
    }

    // ============ 核心函数：创建衍生边 ============
    /**
     * @notice 创建衍生边 A -> B
     * @param fromNode 亲代节点ID
     * @param toNode 子代节点ID
     * @dev 包含：速率限制 + 环形检测 + 基础质押 + 接收方软上限 + 亲代稀释
     */
    function createDerivationEdge(
        bytes32 fromNode,
        bytes32 toNode
    ) external payable whenNotPaused {
        
        // 1. 基础质押检查
        if (msg.value < baseStakeAmount) {
            emit EdgeRejected(fromNode, toNode, msg.sender, "INSUFFICIENT_STAKE");
            revert InsufficientStake(baseStakeAmount, msg.value);
        }

        // 2. 速率限制检查
        _checkRateLimit(msg.sender);

        // 3. 环形检测
        if (_detectCycle(fromNode, toNode)) {
            emit EdgeRejected(fromNode, toNode, msg.sender, "CYCLE_DETECTED");
            revert CycleDetected(fromNode, toNode);
        }

        // 4. 接收方软上限检查
        bool isSlowQueue = _checkReceiverCap(toNode);

        // 5. 亲代稀释检查
        uint256 weight = _calculateDilutedWeight(fromNode, msg.sender);

        // 6. 创建边
        derivationGraph[fromNode][toNode] = true;
        incomingEdges[toNode].push(fromNode);
        
        // 7. 更新计数
        _updateDerivationCount(msg.sender);
        _updateIncomingCount(toNode);
        
        // 8. 记录首次交互时间
        if (firstInteractionTime[msg.sender] == 0) {
            firstInteractionTime[msg.sender] = block.timestamp;
        }
        totalInteractionCount[msg.sender]++;

        // 9. 触发慢速队列标记
        if (isSlowQueue && !inSlowQueue[toNode]) {
            inSlowQueue[toNode] = true;
            slowQueueStart[toNode] = block.timestamp;
        }

        // 10. 触发审查（如果权重异常低）
        if (weight < 50) {
            _flagSuspicion(toNode, 3, weight); // dimension=3: 亲代稀释异常
        }

        emit DerivationEdgeCreated(fromNode, toNode, msg.sender, msg.value, block.timestamp);
    }

    // ============ 速率限制 ============
    function _checkRateLimit(address caller) internal {
        // 重置24h计数
        if (block.timestamp >= dailyCountResetTime[caller] + 1 days) {
            dailyDerivationCount[caller] = 0;
            dailyCountResetTime[caller] = block.timestamp;
        }

        uint256 limit = _getRateLimit(caller);
        
        if (dailyDerivationCount[caller] >= limit) {
            revert RateLimitExceeded(caller, dailyCountResetTime[caller] + 1 days);
        }
    }

    function _getRateLimit(address caller) internal view returns (uint256) {
        // 新钱包（0历史交互）
        if (totalInteractionCount[caller] == 0) {
            return NEW_WALLET_LIMIT;
        }
        
        // 高声誉钱包检查
        if (_isHighReputation(caller)) {
            return HIGH_REPUTATION_LIMIT;
        }
        
        // 普通钱包
        return NORMAL_WALLET_LIMIT;
    }

    function _isHighReputation(address caller) internal view returns (bool) {
        // 简化版：实际应由链下引擎计算势位值后提交
        // 这里用交互次数和活跃时间作为代理指标
        return totalInteractionCount[caller] >= HIGH_REPUTATION_POTENTIAL 
            && block.timestamp >= firstInteractionTime[caller] + ACTIVE_WINDOW;
    }

    function _updateDerivationCount(address caller) internal {
        dailyDerivationCount[caller]++;
    }

    // ============ 环形检测 ============
    function _detectCycle(bytes32 fromNode, bytes32 toNode) internal view returns (bool) {
        // 简单DFS检测：toNode能否通过最多10层回溯到fromNode
        return _dfsDetectCycle(toNode, fromNode, 0);
    }

    function _dfsDetectCycle(
        bytes32 current,
        bytes32 target,
        uint8 depth
    ) internal view returns (bool) {
        if (depth >= MAX_CYCLE_DEPTH) return false;
        if (current == target) return true;
        
        bytes32[] memory parents = incomingEdges[current];
        for (uint i = 0; i < parents.length; i++) {
            if (_dfsDetectCycle(parents[i], target, depth + 1)) {
                return true;
            }
        }
        return false;
    }

    // ============ 接收方软上限 ============
    function _checkReceiverCap(bytes32 toNode) internal returns (bool) {
        // 重置24h计数
        if (block.timestamp >= incomingCountResetTime[toNode] + 1 days) {
            dailyIncomingCount[toNode] = 0;
            incomingCountResetTime[toNode] = block.timestamp;
        }

        dailyIncomingCount[toNode]++;
        
        // 超过软上限，进入慢速队列
        if (dailyIncomingCount[toNode] > RECEIVER_SOFT_CAP) {
            return true;
        }
        return false;
    }

    function _updateIncomingCount(bytes32 toNode) internal {
        // 已在_checkReceiverCap中更新
    }

    // ============ 亲代稀释完整计数 ============
    /**
     * @notice 计算亲代稀释后的权重（四档设计）
     * @param fromNode 亲代节点ID
     * @param caller 调用者钱包
     * @return weight 稀释后的权重（百分比，100=100%）
     * @dev 四档：≤1条100% / 2-10条80% / 11-50条50% / 51+条10%
     */
    function _calculateDilutedWeight(
        bytes32 fromNode,
        address caller
    ) internal returns (uint256) {
        // 检查并重置24h计数
        if (block.timestamp >= walletParentResetTime[caller][fromNode] + 1 days) {
            walletParentCount[caller][fromNode] = 0;
            walletParentResetTime[caller][fromNode] = block.timestamp;
        }
        
        // 增加计数
        walletParentCount[caller][fromNode]++;
        uint256 count = walletParentCount[caller][fromNode];
        
        // 四档稀释
        if (count <= DILUTION_TIER_1) {
            return 100; // 100%（第1条）
        } else if (count <= DILUTION_TIER_2) {
            return 80;  // 80%（2-10条）
        } else if (count <= DILUTION_TIER_3) {
            return 50;  // 50%（11-50条）
        } else {
            return 10;  // 10%（51+条）
        }
    }

    // ============ 审查状态机制 ============
    function _flagSuspicion(
        bytes32 nodeId,
        uint8 dimension,
        uint256 score
    ) internal {
        suspiciousUntil[nodeId] = block.timestamp + REVIEW_PERIOD;
        suspicionDimension[nodeId] = dimension;
        suspicionScore[nodeId] = score;
        
        emit SuspicionFlagged(nodeId, dimension, score, suspiciousUntil[nodeId]);
    }

    /**
     * @notice 清除审查标记（验证通过后调用）
     */
    function clearSuspicion(bytes32 nodeId) external onlyGovernance {
        suspiciousUntil[nodeId] = 0;
        suspicionDimension[nodeId] = 0;
        suspicionScore[nodeId] = 0;
    }

    /**
     * @notice 检查节点是否处于审查期
     */
    function isSuspicious(bytes32 nodeId) external view returns (bool) {
        return block.timestamp < suspiciousUntil[nodeId];
    }

    // ============ 预言机挑战机制 ============
    /**
     * @notice 挑战势位值
     * @param nodeId 被挑战的节点
     * @param claimedPotential 挑战者声称的正确势位值
     */
    function challengePotential(
        bytes32 nodeId,
        uint256 claimedPotential
    ) external payable whenNotPaused {
        // 1. 质押检查
        if (msg.value < CHALLENGE_STAKE) {
            revert InsufficientStake(CHALLENGE_STAKE, msg.value);
        }

        // 2. 冷却期检查
        if (block.timestamp < lastChallengeTime[nodeId] + CHALLENGE_COOLDOWN) {
            revert ChallengeCooldown(nodeId, lastChallengeTime[nodeId] + CHALLENGE_COOLDOWN);
        }

        // 3. 记录挑战
        lastChallengeTime[nodeId] = block.timestamp;
        challengeStakes[nodeId][msg.sender] = msg.value;

        emit ChallengeSubmitted(nodeId, msg.sender, msg.value, block.timestamp);
        
        // 4. 触发链下重新计算（事件通知链下引擎）
        // 链下引擎应在规定时间内重新计算并提交结果
        // 如果结果与 claimedPotential 一致，挑战成功
    }

    /**
     * @notice 解决挑战（由治理/预言机调用）
     * @param nodeId 被挑战节点
     * @param challenger 挑战者地址
     * @param isValid 挑战是否成功（链下重新计算结果与声称值一致）
     */
    function resolveChallenge(
        bytes32 nodeId,
        address challenger,
        bool isValid
    ) external onlyGovernance {
        uint256 stake = challengeStakes[nodeId][challenger];
        require(stake > 0, "No active challenge");

        if (isValid) {
            // 挑战成功：返还质押 + 从原提交者 slash
            challengeStakes[nodeId][challenger] = 0;
            
            // slash 原提交者质押（50%给挑战者，50%给协议库）
            address originalSubmitter = potentialSubmitter[nodeId];
            uint256 slashAmount = 0;
            
            if (originalSubmitter != address(0)) {
                // 获取原提交者的质押（这里简化为固定比例，实际应从质押池读取）
                slashAmount = stake; // 1:1 slash，基于挑战质押金额
                
                // 50% 给挑战者
                uint256 challengerReward = slashAmount / 2;
                payable(challenger).transfer(challengerReward + stake); // 返还质押 + 奖励
                
                // 50% 给协议库（留在合约中）
                uint256 treasuryShare = slashAmount - challengerReward;
                // treasuryShare 自动留在合约余额中
                
                emit ChallengeResolved(nodeId, challenger, true, slashAmount);
            } else {
                // 无原提交者，只返还质押
                payable(challenger).transfer(stake);
                emit ChallengeResolved(nodeId, challenger, true, 0);
            }
        } else {
            // 挑战失败：质押罚没，100%转入协议库
            challengeStakes[nodeId][challenger] = 0;
            // 质押留在合约中，由治理提取
            
            emit ChallengeResolved(nodeId, challenger, false, stake);
        }
    }

    /// @notice 势位更新冷却期（7天）
    uint256 public constant POTENTIAL_COOLDOWN = 7 days;
    
    /// @notice 节点最后势位更新时间
    mapping(bytes32 => uint256) public lastPotentialUpdate;
    
    /// @notice 提交势位值所需最低质押
    uint256 public constant MIN_SUBMIT_STAKE = 0.01 ether;
    /**
     * @notice 提交链下计算的势位值
     * @param nodeId 节点ID
     * @param potential 势位值
     * @dev 由授权的预言机/链下引擎调用，需要质押 + 7天冷却期
     */
    function submitPotential(
        bytes32 nodeId,
        uint256 potential
    ) external payable onlyGovernance {
        require(msg.value >= MIN_SUBMIT_STAKE, "Insufficient submit stake");
        require(
            block.timestamp >= lastPotentialUpdate[nodeId] + POTENTIAL_COOLDOWN,
            "Potential update too frequent"
        );
        
        potentialValue[nodeId] = potential;
        potentialSubmittedAt[nodeId] = block.timestamp;
        potentialSubmitter[nodeId] = msg.sender;
        lastPotentialUpdate[nodeId] = block.timestamp;
    }

    // ============ 治理函数 ============
    function updateBaseStake(uint256 newAmount) external onlyGovernance {
        baseStakeAmount = newAmount;
    }

    function updateGovernance(address newGovernance) external onlyGovernance {
        pendingGovernance = newGovernance;
        governanceChangeTime = block.timestamp;
    }
    
    function acceptGovernance() external {
        require(msg.sender == pendingGovernance, "Only pending governance");
        require(
            block.timestamp >= governanceChangeTime + GOVERNANCE_TIMELOCK,
            "Timelock not expired"
        );
        governance = pendingGovernance;
        pendingGovernance = address(0);
    }

    function setPaused(bool _paused) external onlyGovernance {
        paused = _paused;
    }

    function withdrawTreasury() external onlyGovernance {
        payable(governance).transfer(address(this).balance);
    }

    // ============ 查询函数 ============
    function getNodeStats(bytes32 nodeId) external view returns (
        uint256 incoming24h,
        uint256 potential,
        bool suspicious,
        bool slowQueue
    ) {
        return (
            dailyIncomingCount[nodeId],
            potentialValue[nodeId],
            block.timestamp < suspiciousUntil[nodeId],
            inSlowQueue[nodeId]
        );
    }

    function getWalletStats(address wallet) external view returns (
        uint256 dailyCreated,
        uint256 totalInteractions,
        uint256 firstInteraction,
        uint256 rateLimit
    ) {
        return (
            dailyDerivationCount[wallet],
            totalInteractionCount[wallet],
            firstInteractionTime[wallet],
            _getRateLimit(wallet)
        );
    }

    // 接收ETH
    receive() external payable {}
}

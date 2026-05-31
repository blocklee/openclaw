pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CardNFT
 * @dev ECHO Protocol - 卡牌铸造合约
 * 每张卡牌 = ECHO节点（通过CreatorConfig.createNode存证）
 * 卡牌属性映射ECHO四权：
 *   - usage (用权): 可见性/可使用性
 *   - derive (衍权): 可修改/衍生权限
 *   - expand (扩权): 可编排/扩展权限
 *   - benefit (益权): 收益分配权
 */
contract CardNFT is Ownable, ReentrancyGuard {
    
    // ============ 状态变量 ============
    
    uint256 public constant MINT_FEE = 0.01 ether; // 铸造费用 0.01 MEER
    uint256 public constant PLATFORM_FEE_PERCENT = 2; // 平台手续费 2%
    
    uint256 public nextTokenId;
    mapping(uint256 => Card) public cards;
    mapping(address => uint256[]) public userCards;
    
    // ECHO合约地址
    address public creatorConfig; // CreatorConfig合约地址
    address public edgeDeclaration; // EdgeDeclaration合约地址
    
    // ============ 结构体 ============
    
    struct Card {
        uint256 tokenId;
        address owner;
        string name;        // 卡牌名称
        string uri;         // 元数据URI
        uint8 rarity;       // 稀有度 0=普通,1=稀有,2=史诗,3=传说
        uint16 attack;      // 攻击力 0-1000
        uint16 defense;     // 防御力 0-1000
        uint16 speed;       // 速度 0-1000
        uint8 usage;        // 用权 0-2
        uint8 derive;       // 衍权 0-2
        uint8 expand;       // 扩权 0-2
        uint8 benefit;      // 益权 0-2
        uint256 mintTime;   // 铸造时间
        uint256 shiPosition; // 势位值（动态计算）
        bytes32 echoNodeId;  // ECHO节点ID（链上映射）
    }
    
    // ============ 事件 ============
    
    event CardMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        uint8 rarity,
        uint16 attack,
        uint16 defense,
        uint16 speed,
        bytes32 echoNodeId
    );
    
    event CardBurned(uint256 indexed tokenId, address indexed owner);
    
    event CardTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    event PlatformFeeCollected(uint256 amount, address collector);
    
    // ============ 构造函数 ============
    
    constructor(
        address _creatorConfig,
        address _edgeDeclaration
    ) Ownable(msg.sender) {
        creatorConfig = _creatorConfig;
        edgeDeclaration = _edgeDeclaration;
        nextTokenId = 1;
    }
    
    // ============ 铸造函数 ============
    
    /**
     * @dev 铸造新卡牌
     * @param _name 卡牌名称
     * @param _uri 元数据URI
     * @param _rarity 稀有度
     * @param _attack 攻击力
     * @param _defense 防御力
     * @param _speed 速度
     * @param _fourRights 四权数组 [usage, derive, expand, benefit]
     */
    function mintCard(
        string calldata _name,
        string calldata _uri,
        uint8 _rarity,
        uint16 _attack,
        uint16 _defense,
        uint16 _speed,
        uint8[4] calldata _fourRights
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= MINT_FEE, "Insufficient mint fee");
        require(_rarity <= 3, "Invalid rarity");
        require(_attack <= 1000, "Attack too high");
        require(_defense <= 1000, "Defense too high");
        require(_speed <= 1000, "Speed too high");
        
        uint256 tokenId = nextTokenId++;
        
        // 计算平台手续费
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        
        // 转移手续费到平台
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
            emit PlatformFeeCollected(platformFee, owner());
        }
        
        // 生成ECHO节点ID
        bytes32 echoNodeId = keccak256(abi.encodePacked(
            tokenId,
            msg.sender,
            block.timestamp,
            block.number
        ));
        
        // 创建卡牌
        cards[tokenId] = Card({
            tokenId: tokenId,
            owner: msg.sender,
            name: _name,
            uri: _uri,
            rarity: _rarity,
            attack: _attack,
            defense: _defense,
            speed: _speed,
            usage: _fourRights[0],
            derive: _fourRights[1],
            expand: _fourRights[2],
            benefit: _fourRights[3],
            mintTime: block.timestamp,
            shiPosition: 0, // 初始势位为0
            echoNodeId: echoNodeId
        });
        
        userCards[msg.sender].push(tokenId);
        
        // 调用ECHO CreatorConfig.createNode() 存证
        // 注意：此处需要CreatorConfig合约支持外部调用
        // 如果CreatorConfig不支持，则记录映射关系，由后端索引器处理
        
        emit CardMinted(
            tokenId,
            msg.sender,
            _name,
            _rarity,
            _attack,
            _defense,
            _speed,
            echoNodeId
        );
        
        return tokenId;
    }
    
    // ============ 转让函数 ============
    
    /**
     * @dev 转让卡牌
     */
    function transferCard(uint256 _tokenId, address _to) external {
        Card storage card = cards[_tokenId];
        require(card.owner == msg.sender, "Not owner");
        require(_to != address(0), "Invalid address");
        
        // 更新拥有者
        _removeUserCard(msg.sender, _tokenId);
        card.owner = _to;
        userCards[_to].push(_tokenId);
        
        emit CardTransferred(_tokenId, msg.sender, _to);
    }
    
    // ============ 销毁函数 ============
    
    /**
     * @dev 销毁卡牌
     */
    function burnCard(uint256 _tokenId) external {
        Card storage card = cards[_tokenId];
        require(card.owner == msg.sender, "Not owner");
        
        _removeUserCard(msg.sender, _tokenId);
        delete cards[_tokenId];
        
        emit CardBurned(_tokenId, msg.sender);
    }
    
    // ============ 查询函数 ============
    
    /**
     * @dev 获取卡牌详情
     */
    function getCard(uint256 _tokenId) external view returns (Card memory) {
        return cards[_tokenId];
    }
    
    /**
     * @dev 获取用户所有卡牌
     */
    function getUserCards(address _user) external view returns (uint256[] memory) {
        return userCards[_user];
    }
    
    /**
     * @dev 获取卡牌总数
     */
    function totalCards() external view returns (uint256) {
        return nextTokenId - 1;
    }
    
    /**
     * @dev 获取合约余额
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ============ 内部函数 ============
    
    function _removeUserCard(address _user, uint256 _tokenId) internal {
        uint256[] storage userCardList = userCards[_user];
        for (uint256 i = 0; i < userCardList.length; i++) {
            if (userCardList[i] == _tokenId) {
                userCardList[i] = userCardList[userCardList.length - 1];
                userCardList.pop();
                break;
            }
        }
    }
    
    // ============ 管理函数 ============
    
    /**
     * @dev 更新ECHO合约地址
     */
    function setEchoContracts(
        address _creatorConfig,
        address _edgeDeclaration
    ) external onlyOwner {
        creatorConfig = _creatorConfig;
        edgeDeclaration = _edgeDeclaration;
    }
    
    /**
     * @dev 提取合约余额（仅所有者）
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev 更新势位值（由后端计算后写入）
     */
    function updateShiPosition(uint256 _tokenId, uint256 _shiPosition) external onlyOwner {
        Card storage card = cards[_tokenId];
        require(card.tokenId == _tokenId, "Card does not exist");
        card.shiPosition = _shiPosition;
    }
}

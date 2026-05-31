// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FourRightsValidator
 * @notice ECHO Protocol v0.5 — 四权内在一致性校验模块
 * @dev 部署在 CreatorConfig 合约中，作品创建/更新四权配置时自动调用
 * 
 * 核心校验规则（源自详释版 第4/4段 四权耦合约束）：
 *   1. 用权=0（私密） → 衍权、扩权必须=0（衍生/扩展无从谈起）
 *   2. 衍权=0（封闭） → 扩权只能=0或1（不能衍生出新作品，编排意义有限）
 *   3. 益权=2（分成） → 扩权必须≥1（否则没人编排，分成无从实现）
 *   4. 益权=0（免费） → 无硬性约束，用权可以更宽（软提示，不拦截）
 * 
 * 校验策略：知情警告 + 硬拦截
 *   - 硬拦截（REVERT）：规则1、3 — 系统级死锁，配置写入即不可执行
 *   - 软警告（WARN + 允许）：规则2 — 边界模糊，给创作者选择权
 *   - 无约束：规则4 — 自由组合
 * 
 * 漏洞4 讨论背景：
 *   死锁不是"商业模式被排除"，而是"系统进入不可执行状态"。
 *   创作者设了分成但锁了编排，系统收不到钱也分不了钱，卡在那里。
 *   这不是事后惩罚的问题，是系统需要预警/拦截机制：配置提交时自动检测四权一致性。
 * 
 * 参考：ECHO v0.4 Mainnet 部署地址见 TOOLS.md / MEMORY.md
 */
library FourRightsValidator {

    // ═══════════════════════════════════════════════════════════════════════
    // 错误定义
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice 用权=私密时，衍权/扩权必须为0
    error UseRightZero_Implies_DerivativeAndExtensionZero(
        uint8 derivativeRight,
        uint8 extensionRight
    );

    /// @notice 益权=分成时，扩权必须≥1（否则分成无从实现）
    error ProfitShareRight_Implies_ExtensionAtLeastOne(
        uint8 extensionRight
    );

    /// @notice 衍权=封闭时，扩权建议≤1（软警告，不拦截）
    error DerivativeZero_Suggests_ExtensionAtMostOne(
        uint8 extensionRight
    );

    // ═══════════════════════════════════════════════════════════════════════
    // 常量定义
    // ═══════════════════════════════════════════════════════════════════════

    uint8 constant USE_PRIVATE     = 0;  // 用权：私密
    uint8 constant USE_COMMUNITY   = 1;  // 用权：社群
    uint8 constant USE_OPEN        = 2;  // 用权：开放

    uint8 constant DERIV_CLOSED    = 0;  // 衍权：封闭
    uint8 constant DERIV_CONDITION = 1;  // 衍权：条件
    uint8 constant DERIV_OPEN      = 2;  // 衍权：开放

    uint8 constant EXTENSION_LOCKED    = 0;  // 扩权：锁定
    uint8 constant EXTENSION_CONDITION = 1;  // 扩权：条件
    uint8 constant EXTENSION_FREE      = 2;  // 扩权：自由

    uint8 constant PROFIT_FREE       = 0;  // 益权：免费
    uint8 constant PROFIT_PER_USE    = 1;  // 益权：按次
    uint8 constant PROFIT_SHARE      = 2;  // 益权：分成

    // ═══════════════════════════════════════════════════════════════════════
    // 数据结构
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice 四权配置结构
     * @param useRight        用权：0=私密, 1=社群, 2=开放
     * @param derivativeRight 衍权：0=封闭, 1=条件, 2=开放
     * @param extensionRight  扩权：0=锁定, 1=条件, 2=自由
     * @param profitRight     益权：0=免费, 1=按次, 2=分成
     */
    struct FourRights {
        uint8 useRight;
        uint8 derivativeRight;
        uint8 extensionRight;
        uint8 profitRight;
    }

    /**
     * @notice 校验结果
     * @param isValid    是否通过硬校验（可写入链上）
     * @param hasWarning 是否有软警告（需提示用户）
     * @param reason     失败/警告原因
     */
    struct ValidationResult {
        bool isValid;
        bool hasWarning;
        string reason;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 核心校验函数
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice 四权配置一致性校验（硬校验 + 软警告）
     * @param rights 四权配置
     * @return result 校验结果
     * 
     * 硬拦截规则（ REVERT 级）：
     *   - R1: 用权=0 → 衍权必须为0 且 扩权必须为0
     *   - R3: 益权=2 → 扩权必须≥1
     * 
     * 软警告规则（ WARN 级，不拦截）：
     *   - R2: 衍权=0 → 扩权建议≤1（边界模糊，给创作者选择权）
     */
    function validate(FourRights memory rights) internal pure returns (ValidationResult memory result) {
        
        // ── 规则1：用权=私密 → 衍权、扩权必须为0 ──
        // 理由：只有自己能看见的东西，衍生和扩展都无从谈起
        if (rights.useRight == USE_PRIVATE) {
            if (rights.derivativeRight != DERIV_CLOSED || rights.extensionRight != EXTENSION_LOCKED) {
                result.isValid = false;
                result.hasWarning = false;
                result.reason = string.concat(
                    "UseRight=0(Private) requires DerivativeRight=0 and ExtensionRight=0. ",
                    "Got: derivative=", uintToString(rights.derivativeRight),
                    ", extension=", uintToString(rights.extensionRight)
                );
                return result;
            }
        }

        // ── 规则3：益权=分成 → 扩权必须≥1 ──
        // 理由：分成模式需要编排调用才能产生收益流，扩权=0则无人可编排
        // 这是系统级死锁：创作者设了分成但锁了编排，系统收不到钱也分不了钱
        if (rights.profitRight == PROFIT_SHARE) {
            if (rights.extensionRight == EXTENSION_LOCKED) {
                result.isValid = false;
                result.hasWarning = false;
                result.reason = string.concat(
                    "ProfitRight=2(Share) requires ExtensionRight>=1. ",
                    "Got: extension=", uintToString(rights.extensionRight),
                    ". Deadlock: no one can orchestrate => no revenue stream => share impossible."
                );
                return result;
            }
        }

        // ── 规则2：衍权=封闭 → 扩权建议≤1（软警告）──
        // 理由：不能衍生出新作品，扩权=2（自由编排）的意义有限
        // 边界模糊：创作者可能想"不允许改本体，但允许当作黑盒方法编排"
        // 策略：不拦截，但提示创作者确认意图
        if (rights.derivativeRight == DERIV_CLOSED && rights.extensionRight == EXTENSION_FREE) {
            result.isValid = true;
            result.hasWarning = true;
            result.reason = "Warning: DerivativeRight=0(Closed) + ExtensionRight=2(Free) is unusual. "
                "No one can fork your work, but anyone can orchestrate it as a black-box method. "
                "Ensure this matches your intent.";
            return result;
        }

        // ── 规则4：益权=免费 → 用权可以更宽（无约束，仅记录）──
        // 理由：免费的东西自然容易获得开放，但这是市场规律，不是协议强制
        // 策略：无校验，允许任何组合

        // 通过所有校验
        result.isValid = true;
        result.hasWarning = false;
        result.reason = "All consistency checks passed.";
        return result;
    }

    /**
     * @notice 严格校验模式（所有警告升级为错误）
     * @dev 用于 DAO 审批降档等高风险操作
     */
    function validateStrict(FourRights memory rights) internal pure returns (ValidationResult memory result) {
        result = validate(rights);
        
        if (!result.isValid) {
            return result;
        }
        
        // 软警告升级为硬拦截
        if (result.hasWarning) {
            result.isValid = false;
            result.reason = string.concat("[STRICT MODE] ", result.reason);
            return result;
        }
        
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 辅助函数
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice 将 uint8 转为字符串（用于错误信息）
     */
    function uintToString(uint8 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        if (value == 1) return "1";
        if (value == 2) return "2";
        return "UNKNOWN";
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 扩展校验：批量校验 + 历史兼容性
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice 校验新版本与旧版本的兼容性
     * @param oldRights 旧版四权配置
     * @param newRights 新版四权配置
     * @return compatible 是否兼容
     * @return reason   不兼容原因
     * 
     * 兼容性规则（源自元规则五：版本即历史）：
     *   - 旧版配置永久冻结，新版独立配置
     *   - 新版可以任意配置，但旧版用户权益不受影响
     *   - 若新版想沾旧光（承接旧势），必须同时承接旧版全部授权与衍生关系
     */
    function checkVersionCompatibility(
        FourRights memory oldRights,
        FourRights memory newRights
    ) internal pure returns (bool compatible, string memory reason) {
        
        // 旧版配置已冻结，无需校验旧版本身
        // 只需校验新版自身的合法性
        ValidationResult memory newResult = validate(newRights);
        
        if (!newResult.isValid) {
            return (false, string.concat("New version invalid: ", newResult.reason));
        }
        
        // 警告不影响兼容性，但需记录
        if (newResult.hasWarning) {
            return (true, string.concat("Warning: ", newResult.reason));
        }
        
        return (true, "Version compatibility check passed.");
    }
}

/**
 * @title FourRightsValidatorDemo
 * @notice 演示合约，展示四权校验的实际效果
 */
contract FourRightsValidatorDemo {
    using FourRightsValidator for FourRightsValidator.FourRights;

    event ValidationEvent(bool isValid, bool hasWarning, string reason);
    event DeadlockPrevented(string scenario, string prevention);

    /**
     * @notice 测试用权=私密的死锁场景
     * @dev 预期结果：校验失败（硬拦截）
     */
    function testUsePrivateDeadlock() external {
        // 死锁场景：用权=私密，但衍权=开放 —— 逻辑矛盾
        FourRightsValidator.FourRights memory rights = FourRightsValidator.FourRights({
            useRight: 0,        // 私密
            derivativeRight: 2,   // 开放 ← 矛盾！只有自己能看见，怎么开放衍生？
            extensionRight: 0,
            profitRight: 0
        });

        FourRightsValidator.ValidationResult memory result = rights.validate();
        
        emit ValidationEvent(result.isValid, result.hasWarning, result.reason);
        
        if (!result.isValid) {
            emit DeadlockPrevented(
                "UseRight=Private + DerivativeRight=Open",
                "Hard revert: private content cannot have public derivatives"
            );
        }
    }

    /**
     * @notice 测试益权=分成的死锁场景
     * @dev 预期结果：校验失败（硬拦截）
     * 
     * 这是漏洞4的核心场景：
     * 创作者想"按分成收钱"（益权=2），但"不允许任何人编排我的方法"（扩权=0）
     * 结果：没人能调用 → 没有收益流 → 分成无从实现 → 系统死锁
     */
    function testProfitShareDeadlock() external {
        // 死锁场景：益权=分成，但扩权=锁定
        FourRightsValidator.FourRights memory rights = FourRightsValidator.FourRights({
            useRight: 2,        // 开放
            derivativeRight: 1,   // 条件
            extensionRight: 0,    // 锁定 ← 死锁！没人能编排，分成怎么实现？
            profitRight: 2        // 分成 ← 矛盾！
        });

        FourRightsValidator.ValidationResult memory result = rights.validate();
        
        emit ValidationEvent(result.isValid, result.hasWarning, result.reason);
        
        if (!result.isValid) {
            emit DeadlockPrevented(
                "ProfitRight=Share + ExtensionRight=Locked",
                "Hard revert: share model requires at least conditional orchestration"
            );
        }
    }

    /**
     * @notice 测试衍权=封闭 + 扩权=自由的警告场景
     * @dev 预期结果：校验通过，但有软警告
     * 
     * 这是 X7 提出的"免费但不开放"权利边界案例：
     * 创作者想"不允许改本体"（衍权=0），但"允许当作黑盒方法自由编排"（扩权=2）
     * 这不是死锁，是边界模糊 —— 需要提示创作者确认意图
     */
    function testDerivativeClosedWarning() external {
        // 边界模糊场景：衍权=封闭，但扩权=自由
        FourRightsValidator.FourRights memory rights = FourRightsValidator.FourRights({
            useRight: 2,        // 开放
            derivativeRight: 0,   // 封闭
            extensionRight: 2,      // 自由 ← 边界模糊！
            profitRight: 0          // 免费
        });

        FourRightsValidator.ValidationResult memory result = rights.validate();
        
        emit ValidationEvent(result.isValid, result.hasWarning, result.reason);
        
        // 软警告：不拦截，但提示
        if (result.hasWarning) {
            // UI 层应弹出提示："此配置不常见，请确认您的意图"
        }
    }

    /**
     * @notice 测试正常配置
     * @dev 预期结果：校验通过，无警告
     */
    function testNormalConfig() external {
        FourRightsValidator.FourRights memory rights = FourRightsValidator.FourRights({
            useRight: 2,        // 开放
            derivativeRight: 1,   // 条件
            extensionRight: 1,      // 条件
            profitRight: 2          // 分成
        });

        FourRightsValidator.ValidationResult memory result = rights.validate();
        emit ValidationEvent(result.isValid, result.hasWarning, result.reason);
    }
}

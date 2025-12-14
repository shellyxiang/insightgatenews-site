// 会员登录系统 JavaScript
class MembershipSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    // 加载用户数据
    loadUserData() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 选项卡切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 登录表单提交
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 注册表单提交
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 管理员登录表单提交
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        // 退出登录
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn') {
                this.logout();
            }
        });

        // 页面加载时检查管理员状态并显示管理员链接
        this.showAdminNavigation();
    }

    // 切换选项卡
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新表单显示
        document.querySelectorAll('.form-content').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tabName}-form`).classList.add('active');
    }

    // 处理登录
    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!this.validateEmail(email)) {
            this.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('密码长度至少6位', 'error');
            return;
        }

        // 模拟登录验证
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            this.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // 记录登录时间
            this.recordLoginTime();
            
            this.showMessage('登录成功！', 'success');
            this.showUserDashboard();
        } else {
            this.showMessage('邮箱或密码错误', 'error');
        }
    }

    // 处理注册
    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        // 验证表单
        if (!username || !email || !password) {
            this.showMessage('请填写所有必填字段', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('密码长度至少6位', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('两次输入的密码不一致', 'error');
            return;
        }

        if (!document.getElementById('agree-terms').checked) {
            this.showMessage('请同意服务条款', 'error');
            return;
        }

        // 检查邮箱是否已注册
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        if (users.find(u => u.email === email)) {
            this.showMessage('该邮箱已被注册', 'error');
            return;
        }

        // 创建新用户（默认未订阅状态）
        const newUser = {
            id: this.generateId(),
            username: username,
            email: email,
            password: password,
            joinDate: new Date().toISOString(),
            membershipLevel: 'basic',
            subscriptionStatus: 'inactive', // 'active' | 'inactive' | 'expired'
            downloadCount: 0,
            lastLogin: null
        };

        users.push(newUser);
        localStorage.setItem('membershipUsers', JSON.stringify(users));

        this.showMessage('🎉 注册成功！欢迎加入Insight Gate会员社区', 'success');
        
        // 自动登录新注册的用户
        this.currentUser = newUser;
        this.isLoggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        // 2秒后显示用户仪表板
        setTimeout(() => {
            this.showUserDashboard();
        }, 2000);
        
        // 清空注册表单
        document.getElementById('registerForm').reset();
    }

    // 检查登录状态
    checkLoginStatus() {
        if (this.isLoggedIn) {
            this.showUserDashboard();
        }
    }

    // 显示用户仪表板
    showUserDashboard() {
        document.querySelector('.login-section').style.display = 'none';
        document.getElementById('user-dashboard').style.display = 'block';
        
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.username;
            
            // 根据订阅状态动态渲染用户界面
            this.renderUserDashboard();
            
            // 更新导航栏显示
            this.updateNavigation();
        }
    }

    // 动态渲染用户仪表板
    renderUserDashboard() {
        if (!this.currentUser) return;
        
        const status = this.currentUser.subscriptionStatus || 'inactive';
        const statusElement = document.getElementById('subscription-status');
        const statusLabel = document.getElementById('status-label');
        const statusDescription = document.getElementById('status-description');
        const featuresGrid = document.getElementById('features-grid');
        
        // 更新状态显示
        statusElement.className = `status-badge ${status}`;
        
        switch(status) {
            case 'active':
                statusLabel.textContent = '会员状态：已开通';
                statusDescription.textContent = '您已成功开通会员，享受所有研报下载权限！';
                this.renderActiveUserFeatures();
                break;
            case 'inactive':
                statusLabel.textContent = '会员状态：未开通';
                statusDescription.textContent = '开通后即可解锁全部研报下载权限。';
                this.renderInactiveUserFeatures();
                break;
            case 'expired':
                statusLabel.textContent = '会员状态：已过期';
                statusDescription.textContent = '您的会员已过期，请续费以继续使用服务。';
                this.renderExpiredUserFeatures();
                break;
        }
        
        // 更新账户信息
        this.updateAccountInfo();
    }

    // 渲染已开通用户的功能
    renderActiveUserFeatures() {
        const featuresGrid = document.getElementById('features-grid');
        featuresGrid.innerHTML = `
            <div class="feature-card active">
                <div class="feature-icon">📄</div>
                <h3 class="feature-title">研报下载</h3>
                <p class="feature-description">无限下载专业研报PDF文件</p>
                <div class="feature-action">
                    <button class="btn-primary" onclick="goToReports()">立即下载</button>
                </div>
            </div>
            <div class="feature-card active">
                <div class="feature-icon">📊</div>
                <h3 class="feature-title">数据分析</h3>
                <p class="feature-description">访问深度数据分析报告</p>
                <div class="feature-action">
                    <button class="btn-primary" onclick="showDownloadHistory()">查看报告</button>
                </div>
            </div>
            <div class="feature-card active">
                <div class="feature-icon">🔔</div>
                <h3 class="feature-title">实时提醒</h3>
                <p class="feature-description">重要市场动态实时推送</p>
                <div class="feature-action">
                    <button class="btn-primary" onclick="showSecurity()">设置提醒</button>
                </div>
            </div>
        `;
        
        // 对已开通用户隐藏订阅区域
        document.getElementById('subscription-section').style.display = 'none';
    }

    // 渲染未开通用户的功能
    renderInactiveUserFeatures() {
        const featuresGrid = document.getElementById('features-grid');
        featuresGrid.innerHTML = `
            <div class="feature-card inactive">
                <div class="feature-icon">🔒</div>
                <h3 class="feature-title">研报下载</h3>
                <p class="feature-description">开通会员后解锁无限下载权限</p>
                <div class="feature-action">
                    <span class="locked-text">🔒 需开通会员</span>
                </div>
            </div>
            <div class="feature-card inactive">
                <div class="feature-icon">🔒</div>
                <h3 class="feature-title">数据分析</h3>
                <p class="feature-description">开通会员后访问深度分析报告</p>
                <div class="feature-action">
                    <span class="locked-text">🔒 需开通会员</span>
                </div>
            </div>
            <div class="feature-card inactive">
                <div class="feature-icon">🔒</div>
                <h3 class="feature-title">实时提醒</h3>
                <p class="feature-description">开通会员后获取实时市场动态</p>
                <div class="feature-action">
                    <span class="locked-text">🔒 需开通会员</span>
                </div>
            </div>
        `;
        
        // 对未开通用户显示订阅区域
        document.getElementById('subscription-section').style.display = 'block';
    }

    // 渲染已过期用户的功能
    renderExpiredUserFeatures() {
        const featuresGrid = document.getElementById('features-grid');
        featuresGrid.innerHTML = `
            <div class="feature-card inactive">
                <div class="feature-icon">⏰</div>
                <h3 class="feature-title">研报下载</h3>
                <p class="feature-description">会员已过期，请续费以恢复下载权限</p>
                <div class="feature-action">
                    <span class="locked-text">⏰ 已过期</span>
                </div>
            </div>
            <div class="feature-card inactive">
                <div class="feature-icon">⏰</div>
                <h3 class="feature-title">数据分析</h3>
                <p class="feature-description">会员已过期，请续费以恢复分析权限</p>
                <div class="feature-action">
                    <span class="locked-text">⏰ 已过期</span>
                </div>
            </div>
            <div class="feature-card inactive">
                <div class="feature-icon">⏰</div>
                <h3 class="feature-title">实时提醒</h3>
                <p class="feature-description">会员已过期，请续费以恢复提醒服务</p>
                <div class="feature-action">
                    <span class="locked-text">⏰ 已过期</span>
                </div>
            </div>
        `;
        
        // 对已过期用户显示订阅区域
        document.getElementById('subscription-section').style.display = 'block';
    }

    // 更新账户信息
    updateAccountInfo() {
        if (!this.currentUser) return;
        
        document.getElementById('user-email').textContent = this.currentUser.email;
        document.getElementById('join-date').textContent = new Date(this.currentUser.joinDate).toLocaleDateString('zh-CN');
    }

    // 更新导航栏
    updateNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.textContent === '会员登录') {
                link.innerHTML = '<span id="user-menu">👤 ' + this.currentUser.username + '</span>';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showUserMenu();
                });
            }
        });
    }

    // 显示用户菜单
    showUserMenu() {
        // 可以在这里添加下拉菜单功能
        console.log('显示用户菜单');
    }

    // 退出登录
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        
        document.getElementById('user-dashboard').style.display = 'none';
        document.querySelector('.login-section').style.display = 'block';
        
        // 重置导航栏
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.querySelector('#user-menu')) {
                link.innerHTML = '会员登录';
                link.href = 'login.html';
            }
        });
        
        this.showMessage('已退出登录', 'info');
    }

    // 记录下载历史
    recordDownload(reportId, reportTitle) {
        if (!this.isLoggedIn) return;
        
        const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        const downloadRecord = {
            id: this.generateId(),
            userId: this.currentUser.id,
            reportId: reportId,
            reportTitle: reportTitle,
            downloadTime: new Date().toISOString(),
            ip: '127.0.0.1' // 模拟IP地址
        };
        
        downloadHistory.push(downloadRecord);
        localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
        
        // 更新用户下载计数
        this.currentUser.downloadCount = (this.currentUser.downloadCount || 0) + 1;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    // 处理管理员登录
    async handleAdminLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const code = document.getElementById('admin-code').value;

        // 默认管理员凭据（生产环境中应该从安全配置中读取）
        const adminCredentials = {
            username: 'admin',
            password: 'admin123',
            code: 'insightgate2024'
        };

        if (username !== adminCredentials.username) {
            this.showMessage('管理员账号错误', 'error');
            return;
        }

        if (password !== adminCredentials.password) {
            this.showMessage('管理员密码错误', 'error');
            return;
        }

        if (code !== adminCredentials.code) {
            this.showMessage('管理员密钥错误', 'error');
            return;
        }

        // 管理员登录成功
        this.currentUser = {
            id: 'admin-001',
            username: '管理员',
            email: 'admin@insightgate.com',
            role: 'admin',
            isAdmin: true,
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        this.isLoggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('isAdminLoggedIn', 'true');
        
        this.showMessage('👑 管理员登录成功！', 'success');
        
        // 2秒后跳转到管理员页面
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 2000);
    }

    // 检查是否为管理员
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // 显示管理员导航链接
    showAdminNavigation() {
        // 检查是否已登录管理员
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
        
        if (currentUser.role === 'admin' && isAdminLoggedIn) {
            // 查找并显示管理员链接
            const adminLinks = document.querySelectorAll('[href="admin.html"]');
            adminLinks.forEach(link => {
                const parentLi = link.closest('li');
                if (parentLi) {
                    parentLi.style.display = 'block';
                    // 确保链接是可见的
                    link.style.display = 'inline';
                }
            });
            
            // 如果是登录页面，直接跳转到管理员页面
            if (window.location.pathname.includes('login.html')) {
                // 检查当前是否显示登录表单
                const loginForm = document.getElementById('login-form');
                const userDashboard = document.getElementById('user-dashboard');
                
                if (loginForm && loginForm.classList.contains('active')) {
                    // 显示用户已登录的提示，并提供跳转选项
                    this.showMessage('👑 您已登录为管理员，点击跳转到管理员页面', 'success');
                    
                    // 添加跳转按钮
                    setTimeout(() => {
                        const confirmMsg = confirm('您已登录为管理员，是否跳转到管理员页面？');
                        if (confirmMsg) {
                            window.location.href = 'admin.html';
                        }
                    }, 1000);
                }
            }
        }
    }



    // 记录登录时间
    recordLoginTime() {
        if (this.currentUser) {
            this.currentUser.lastLogin = new Date().toISOString();
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }

    // 验证邮箱格式
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 移除现有消息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // 添加到页面
        document.body.appendChild(messageDiv);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // 支付功能方法
    openPaymentModal(planType, amount) {
        this.currentPaymentPlan = planType;
        this.currentPaymentAmount = amount;
        
        // 更新支付模态框内容
        document.getElementById('amount-value').textContent = `¥${amount}`;
        document.getElementById('amount-period').textContent = planType === 'monthly' ? '月度会员' : '年度会员';
        
        // 显示支付模态框
        document.getElementById('payment-modal').style.display = 'block';
        
        // 重置支付方式选择
        this.resetPaymentMethods();
    }

    // 选择支付方式
    selectPaymentMethod(method) {
        this.currentPaymentMethod = method;
        
        // 重置所有支付方式的选中状态
        this.resetPaymentMethods();
        
        // 设置当前选择的支付方式
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(pm => {
            if (pm.getAttribute('onclick').includes(method)) {
                pm.classList.add('selected');
            }
        });
    }

    // 重置支付方式选择
    resetPaymentMethods() {
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(pm => {
            pm.classList.remove('selected');
        });
    }

    // 处理支付
    processPayment() {
        if (!this.currentPaymentMethod) {
            this.showMessage('请选择支付方式', 'error');
            return;
        }

        if (!this.currentUser) {
            this.showMessage('请先登录', 'error');
            return;
        }

        // 模拟支付处理
        this.showMessage('💰 正在处理支付...', 'info');
        
        setTimeout(() => {
            // 更新用户订阅状态
            this.currentUser.subscriptionStatus = 'active';
            this.currentUser.subscriptionPlan = this.currentPaymentPlan;
            this.currentUser.subscriptionStartDate = new Date().toISOString();
            this.currentUser.subscriptionEndDate = this.calculateSubscriptionEndDate();
            
            // 保存到本地存储
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // 更新用户列表中的用户信息
            this.updateUserInStorage();
            
            // 关闭支付模态框
            this.closePaymentModal();
            
            // 显示成功消息
            this.showMessage('🎉 支付成功！会员已开通', 'success');
            
            // 重新渲染用户仪表板
            this.renderUserDashboard();
            
        }, 2000);
    }

    // 关闭支付模态框
    closePaymentModal() {
        document.getElementById('payment-modal').style.display = 'none';
        this.currentPaymentMethod = null;
        this.currentPaymentPlan = null;
        this.currentPaymentAmount = null;
        this.resetPaymentMethods();
    }

    // 计算订阅结束日期
    calculateSubscriptionEndDate() {
        const startDate = new Date();
        if (this.currentPaymentPlan === 'monthly') {
            startDate.setMonth(startDate.getMonth() + 1);
        } else if (this.currentPaymentPlan === 'annual') {
            startDate.setFullYear(startDate.getFullYear() + 1);
        }
        return startDate.toISOString();
    }

    // 更新存储中的用户信息
    updateUserInStorage() {
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            localStorage.setItem('membershipUsers', JSON.stringify(users));
        }
    }
}

// 页面功能函数
function goToReports() {
    window.location.href = 'research-reports.html';
}

function showProfile() {
    alert('用户资料编辑功能开发中...');
}

function showDownloadHistory() {
    alert('下载历史查看功能开发中...');
}

function showSecurity() {
    alert('安全设置功能开发中...');
}

// 订阅功能函数
function subscribeMonthly() {
    if (window.membershipSystem && window.membershipSystem.currentUser) {
        window.membershipSystem.openPaymentModal('monthly', 99);
    } else {
        alert('请先登录后再进行订阅操作');
    }
}

function subscribeAnnual() {
    if (window.membershipSystem && window.membershipSystem.currentUser) {
        window.membershipSystem.openPaymentModal('annual', 888);
    } else {
        alert('请先登录后再进行订阅操作');
    }
}

// 全局支付功能对象
window.loginApp = {
    selectPaymentMethod: function(method) {
        if (window.membershipSystem) {
            window.membershipSystem.selectPaymentMethod(method);
        }
    },
    
    processPayment: function() {
        if (window.membershipSystem) {
            window.membershipSystem.processPayment();
        }
    },
    
    closePaymentModal: function() {
        if (window.membershipSystem) {
            window.membershipSystem.closePaymentModal();
        }
    }
};

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.membershipSystem = new MembershipSystem();
    
    // 设置支付模态框关闭事件
    const closePaymentBtn = document.querySelector('.close-payment');
    const paymentModal = document.getElementById('payment-modal');
    
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener('click', () => {
            window.loginApp.closePaymentModal();
        });
    }
    
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                window.loginApp.closePaymentModal();
            }
        });
    }
});

// 导出到全局作用域
window.MembershipSystem = MembershipSystem;

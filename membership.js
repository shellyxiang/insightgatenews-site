// 会员保护系统
class MembershipProtection {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.loadUserData();
        this.checkLoginStatus();
        this.protectContent();
    }

    // 加载用户数据
    loadUserData() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
        }
    }

    // 检查登录状态
    checkLoginStatus() {
        if (this.isLoggedIn) {
            this.showAuthenticatedUI();
        } else {
            this.showProtectedUI();
        }
    }

    // 保护内容
    protectContent() {
        // 保护PDF下载区域
        this.protectPDFDownloads();
        
        // 保护研报列表
        this.protectReports();
        
        // 添加登录提示
        this.addLoginPrompts();
    }

    // 保护PDF下载
    protectPDFDownloads() {
        const downloadButtons = document.querySelectorAll('.download-btn, .pdf-link');
        
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isLoggedIn) {
                    e.preventDefault();
                    this.showLoginRequired('下载PDF');
                } else {
                    // 记录下载历史
                    const reportId = btn.dataset.reportId || 'unknown';
                    const reportTitle = btn.dataset.reportTitle || '研报';
                    this.recordDownload(reportId, reportTitle);
                }
            });
        });
    }

    // 保护研报列表
    protectReports() {
        const reportsSection = document.querySelector('.reports-section');
        if (reportsSection && !this.isLoggedIn) {
            this.addProtectionOverlay(reportsSection, '研报列表');
        }
    }

    // 添加保护层
    addProtectionOverlay(element, contentName) {
        const lockDiv = document.createElement('div');
        lockDiv.className = 'membership-lock';
        lockDiv.innerHTML = `
            <div class="lock-content">
                <div class="lock-icon">🔒</div>
                <h3>会员专属内容</h3>
                <p>${contentName}需要会员权限才能访问</p>
                <button class="btn-primary" onclick="window.location.href='login.html'">
                    立即登录
                </button>
            </div>
        `;
        
        element.classList.add('membership-protected');
        element.appendChild(lockDiv);
    }

    // 显示登录提示
    addLoginPrompts() {
        if (!this.isLoggedIn) {
            // 在页面顶部添加登录提示
            const header = document.querySelector('.page-header');
            if (header) {
                const loginPrompt = document.createElement('div');
                loginPrompt.className = 'login-prompt';
                loginPrompt.innerHTML = `
                    <div class="prompt-content">
                        <span>🔒 登录后解锁完整研报下载权限</span>
                        <button class="btn-small" onclick="window.location.href='login.html'">
                            立即登录
                        </button>
                    </div>
                `;
                header.after(loginPrompt);
            }
        }
    }

    // 显示认证后的UI
    showAuthenticatedUI() {
        // 移除保护层
        document.querySelectorAll('.membership-lock').forEach(lock => lock.remove());
        document.querySelectorAll('.membership-protected').forEach(el => {
            el.classList.remove('membership-protected');
        });
        
        // 更新导航栏
        this.updateNavigation();
        
        // 显示欢迎信息
        this.showWelcomeMessage();
    }

    // 显示保护UI
    showProtectedUI() {
        // 页面已通过 addProtectionOverlay 方法处理
    }

    // 更新导航栏
    updateNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.textContent === '会员登录' || link.href.includes('login.html')) {
                link.innerHTML = '<span id="user-menu">👤 ' + this.currentUser.username + '</span>';
                link.href = '#';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showUserMenu();
                });
            }
        });
    }

    // 显示用户菜单
    showUserMenu() {
        // 创建下拉菜单
        const menu = document.createElement('div');
        menu.className = 'user-menu-dropdown';
        menu.innerHTML = `
            <div class="menu-item" onclick="window.location.href='login.html'">会员中心</div>
            <div class="menu-item" onclick="membershipProtection.logout()">退出登录</div>
        `;
        
        const navLink = document.querySelector('#user-menu');
        const rect = navLink.getBoundingClientRect();
        
        menu.style.position = 'absolute';
        menu.style.top = (rect.bottom + 10) + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.zIndex = '1000';
        
        document.body.appendChild(menu);
        
        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }

    // 显示欢迎信息
    showWelcomeMessage() {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.innerHTML = `
            <div class="welcome-content">
                <span>👋 欢迎回来，${this.currentUser.username}！您的会员权限已激活</span>
                <span class="close-welcome" onclick="this.parentElement.remove()">×</span>
            </div>
        `;
        
        document.body.insertBefore(welcomeMsg, document.body.firstChild);
        
        // 5秒后自动消失
        setTimeout(() => {
            if (welcomeMsg.parentNode) {
                welcomeMsg.remove();
            }
        }, 5000);
    }

    // 显示登录要求提示
    showLoginRequired(action) {
        const modal = document.createElement('div');
        modal.className = 'login-required-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔒 会员专属功能</h3>
                    <span class="close-modal" onclick="this.parentElement.parentElement.remove()">×</span>
                </div>
                <div class="modal-body">
                    <p>${action}功能需要会员权限才能使用</p>
                    <div class="modal-buttons">
                        <button class="btn-primary" onclick="window.location.href='login.html'">
                            立即登录
                        </button>
                        <button class="btn-secondary" onclick="this.parentElement.parentElement.remove()">
                            稍后再说
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
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
            ip: '127.0.0.1'
        };
        
        downloadHistory.push(downloadRecord);
        localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
        
        // 更新用户下载计数
        this.currentUser.downloadCount = (this.currentUser.downloadCount || 0) + 1;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.showMessage('下载已开始', 'success');
    }

    // 退出登录
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        
        // 刷新页面以重新应用保护
        window.location.reload();
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// 初始化保护系统
document.addEventListener('DOMContentLoaded', () => {
    window.membershipProtection = new MembershipProtection();
});

// 导出到全局作用域
window.MembershipProtection = MembershipProtection;
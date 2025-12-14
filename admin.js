// 管理员系统 JavaScript
class AdminSystem {
    constructor() {
        this.isAdmin = false;
        this.adminInfo = null;
        this.init();
    }

    init() {
        this.checkAdminStatus();
        this.setupEventListeners();
    }

    // 检查管理员状态
    checkAdminStatus() {
        const savedAdmin = localStorage.getItem('adminInfo');
        if (savedAdmin) {
            this.adminInfo = JSON.parse(savedAdmin);
            this.isAdmin = true;
            this.showDashboard();
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 管理员登录表单
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        // 用户搜索
        document.getElementById('user-search').addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });
    }

    // 处理管理员登录
    handleAdminLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        // 默认管理员账号（生产环境应该从服务器获取）
        const adminAccounts = [
            { username: 'admin', password: 'admin123', role: 'superadmin' },
            { username: 'manager', password: 'manager123', role: 'manager' },
            // 超级管理员特权 - 任何密码都能登录
            { username: 'superadmin', password: password, role: 'superadmin' }
        ];

        const admin = adminAccounts.find(acc => 
            acc.username === username && acc.password === password
        );

        if (admin) {
            this.adminInfo = {
                username: admin.username,
                role: admin.role,
                loginTime: new Date().toISOString(),
                ip: '127.0.0.1'
            };
            
            localStorage.setItem('adminInfo', JSON.stringify(this.adminInfo));
            this.isAdmin = true;
            this.showDashboard();
            this.showMessage('管理员登录成功！', 'success');
        } else {
            this.showMessage('管理员账号或密码错误', 'error');
        }
    }

    // 显示管理仪表板
    showDashboard() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        
        this.loadStatistics();
        this.loadUsersList();
    }

    // 加载统计数据
    loadStatistics() {
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        
        // 总用户数
        document.getElementById('total-users').textContent = users.length;
        
        // 今日登录数
        const today = new Date().toDateString();
        const todayLogins = users.filter(user => 
            user.lastLogin && new Date(user.lastLogin).toDateString() === today
        ).length;
        document.getElementById('today-logins').textContent = todayLogins;
        
        // 总下载量
        document.getElementById('total-downloads').textContent = downloadHistory.length;
        
        // 活跃用户（最近7天有登录的）
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = users.filter(user => 
            user.lastLogin && new Date(user.lastLogin) > sevenDaysAgo
        ).length;
        document.getElementById('active-users').textContent = activeUsers;
    }

    // 加载用户列表
    loadUsersList() {
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            // 计算用户下载次数
            const userDownloads = downloadHistory.filter(dl => dl.userId === user.id).length;
            
            // 格式化时间
            const formatDate = (dateString) => {
                if (!dateString) return '从未登录';
                const date = new Date(dateString);
                return date.toLocaleString('zh-CN');
            };
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${formatDate(user.joinDate)}</td>
                <td>${formatDate(user.lastLogin)}</td>
                <td>${userDownloads}</td>
                <td>
                    <span class="membership-badge">${user.membershipLevel || 'basic'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-warning" onclick="adminSystem.resetPassword('${user.id}')">
                            重置密码
                        </button>
                        <button class="btn-small btn-danger" onclick="adminSystem.deleteUser('${user.id}')">
                            删除
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 搜索用户
    searchUsers(query) {
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const filteredUsers = users.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );
        
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        
        filteredUsers.forEach(user => {
            const userDownloads = downloadHistory.filter(dl => dl.userId === user.id).length;
            
            const formatDate = (dateString) => {
                if (!dateString) return '从未登录';
                const date = new Date(dateString);
                return date.toLocaleString('zh-CN');
            };
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${formatDate(user.joinDate)}</td>
                <td>${formatDate(user.lastLogin)}</td>
                <td>${userDownloads}</td>
                <td>
                    <span class="membership-badge">${user.membershipLevel || 'basic'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-warning" onclick="adminSystem.resetPassword('${user.id}')">
                            重置密码
                        </button>
                        <button class="btn-small btn-danger" onclick="adminSystem.deleteUser('${user.id}')">
                            删除
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 重置用户密码
    resetPassword(userId) {
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            if (confirm(`确定要重置用户 "${users[userIndex].username}" 的密码吗？新密码将设置为 "123456"`)) {
                users[userIndex].password = '123456';
                localStorage.setItem('membershipUsers', JSON.stringify(users));
                this.showMessage('密码重置成功！新密码：123456', 'success');
                this.loadUsersList();
            }
        }
    }

    // 删除用户
    deleteUser(userId) {
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            const userName = users[userIndex].username;
            if (confirm(`确定要永久删除用户 "${userName}" 吗？此操作不可撤销！`)) {
                users.splice(userIndex, 1);
                localStorage.setItem('membershipUsers', JSON.stringify(users));
                
                // 同时删除该用户的下载历史
                const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
                const filteredHistory = downloadHistory.filter(dl => dl.userId !== userId);
                localStorage.setItem('downloadHistory', JSON.stringify(filteredHistory));
                
                this.showMessage(`用户 "${userName}" 已删除`, 'success');
                this.loadStatistics();
                this.loadUsersList();
            }
        }
    }

    // 导出用户数据
    exportUserData() {
        const users = JSON.parse(localStorage.getItem('membershipUsers') || '[]');
        const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        
        const exportData = {
            exportTime: new Date().toISOString(),
            totalUsers: users.length,
            totalDownloads: downloadHistory.length,
            users: users.map(user => ({
                ...user,
                downloadCount: downloadHistory.filter(dl => dl.userId === user.id).length,
                // 移除密码字段
                password: undefined
            })),
            downloadHistory: downloadHistory
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `insightgate_users_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showMessage('用户数据导出成功！', 'success');
    }

    // 退出登录
    logout() {
        localStorage.removeItem('adminInfo');
        this.isAdmin = false;
        this.adminInfo = null;
        
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('admin-login').style.display = 'block';
        
        // 清空表单
        document.getElementById('adminLoginForm').reset();
        
        this.showMessage('已退出管理员登录', 'info');
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 移除现有消息
        const existingMessage = document.querySelector('.admin-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-message message-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            z-index: 1000;
            font-weight: 500;
            ${type === 'success' ? 'background: #28a745;' : ''}
            ${type === 'error' ? 'background: #dc3545;' : ''}
            ${type === 'info' ? 'background: #17a2b8;' : ''}
        `;
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
}

// 页面功能函数
function exportData() {
    window.adminSystem.exportUserData();
}

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.adminSystem = new AdminSystem();
});

// 导出到全局作用域
window.AdminSystem = AdminSystem;

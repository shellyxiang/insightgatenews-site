// 导航栏响应式功能
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // 移动端菜单切换
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // 点击导航链接关闭移动端菜单
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 导航栏滚动效果
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(26, 60, 39, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, var(--primary-dark-green), var(--primary-green))';
            navbar.style.backdropFilter = 'none';
        }
    });
    
    // 自动设置导航栏激活状态
    activateNavbar();
    
    // 立即激活自定义背景图片
    activateCustomBackground();
});

// 自动设置导航栏激活状态
function activateNavbar() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // 移除所有导航链接的active类
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 根据当前页面设置对应的导航链接为激活状态
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // 处理首页
        if (currentPage === 'index.html' && (href === 'index.html' || href === './')) {
            link.classList.add('active');
            return;
        }
        
        // 处理其他页面
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });
}

// 激活自定义背景图片 - 只应用到标题区域
function activateCustomBackground() {
    const header = document.querySelector('.page-header');
    
    if (header) {
        header.classList.add('custom-bg');
    }
}

// 金融基础页面功能
function loadFinanceBasics() {
    const categories = {
        '基础知识': [
            { title: '金融市场概述', content: '了解金融市场的基本结构和功能...' },
            { title: '投资基本概念', content: '学习投资的基本术语和原理...' }
        ],
        '交易': [
            { title: '股票交易入门', content: '掌握股票交易的基本流程...' },
            { title: '技术分析基础', content: '学习图表分析和指标运用...' }
        ],
        '风险管理': [
            { title: '风险评估方法', content: '学习如何评估投资风险...' },
            { title: '资产配置策略', content: '了解科学的资产配置方法...' }
        ]
    };

    return categories;
}

// 每日资讯数据模拟
function getDailyNews() {
    return [
        {
            title: 'A股市场今日表现',
            summary: '上证指数上涨0.5%，创业板指表现强劲',
            timestamp: '2024-01-15 15:00',
            data: {
                '上证指数': '+0.5%',
                '深证成指': '+0.8%',
                '创业板指': '+1.2%'
            }
        },
        {
            title: '美联储政策动向',
            summary: '美联储维持利率不变，市场预期明年可能降息',
            timestamp: '2024-01-15 14:30'
        }
    ];
}

// PDF上传功能
function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        // 这里可以添加文件上传逻辑
        alert(`文件 ${file.name} 上传成功！`);
    } else {
        alert('请上传PDF文件');
    }
}




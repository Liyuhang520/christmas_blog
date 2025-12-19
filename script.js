// =========================================
// 圣诞节网站交互脚本 - 完整优化版
// =========================================

// 雪花和鼠标配置
const SNOW_CONFIG = {
    density: 150,
    speed: 2,
    minSize: 2,
    maxSize: 6,
    color: 'rgba(255, 255, 255, 0.8)'
};

const MOUSE_TRAIL_CONFIG = {
    interval: 150,
    fadeDuration: 2000,
    icons: ['🎁', '🍬', '🎅', '🦌', '⭐', '❄️', '🎀', '🧸', '🎄']
};

// 雪花动画类
class SnowAnimation {
    constructor() {
        this.canvas = document.getElementById('snowCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.snowflakes = [];
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        for (let i = 0; i < SNOW_CONFIG.density; i++) {
            this.snowflakes.push(this.createSnowflake());
        }
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createSnowflake() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height - this.canvas.height,
            size: Math.random() * (SNOW_CONFIG.maxSize - SNOW_CONFIG.minSize) + SNOW_CONFIG.minSize,
            speed: Math.random() * SNOW_CONFIG.speed + 0.5,
            wind: Math.random() * 0.5 - 0.25,
            opacity: Math.random() * 0.6 + 0.4
        };
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.snowflakes.forEach(flake => {
            flake.y += flake.speed;
            flake.x += flake.wind;
            if (flake.y > this.canvas.height) {
                Object.assign(flake, this.createSnowflake());
                flake.y = -10;
            }
            this.ctx.save();
            this.ctx.globalAlpha = flake.opacity;
            this.ctx.fillStyle = SNOW_CONFIG.color;
            this.ctx.beginPath();
            this.ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        requestAnimationFrame(() => this.animate());
    }
}

// 鼠标跟随类
class MouseTrail {
    constructor() {
        this.lastTime = 0;
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            const currentTime = Date.now();
            if (currentTime - this.lastTime > MOUSE_TRAIL_CONFIG.interval) {
                this.createTrail(e.clientX, e.clientY);
                this.lastTime = currentTime;
            }
        });
    }

    createTrail(x, y) {
        const icon = document.createElement('div');
        icon.className = 'mouse-trail';
        icon.textContent = MOUSE_TRAIL_CONFIG.icons[
            Math.floor(Math.random() * MOUSE_TRAIL_CONFIG.icons.length)
        ];
        icon.style.left = x + 'px';
        icon.style.top = y + 'px';
        icon.style.animationDuration = MOUSE_TRAIL_CONFIG.fadeDuration + 'ms';
        document.body.appendChild(icon);
        setTimeout(() => {
            if (icon.parentNode) {
                icon.parentNode.removeChild(icon);
            }
        }, MOUSE_TRAIL_CONFIG.fadeDuration);
    }
}

// =========================================
// 视频控制类 - 硬编码+自动恢复声音
// =========================================
class VideoController {
    constructor() {
        this.bgVideo = document.getElementById('bgVideo');
        this.playPauseBtn = document.getElementById('playPause');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.hoverZone = document.querySelector('.hover-trigger-zone');
        this.videoControl = document.querySelector('.video-control');
        this.isPlaying = false;
        this.soundRestored = false;
        this.userPaused = false;
    }

    init() {
        // 设置初始音量
        this.bgVideo.volume = 0.6;
        this.volumeSlider.value = 60;
        this.volumeValue.textContent = '60%';

        // 音量控制
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.bgVideo.volume = volume;
            this.volumeValue.textContent = e.target.value + '%';
            if (this.bgVideo.muted && volume > 0) {
                this.bgVideo.muted = false;
                this.soundRestored = true;
            }
        });

        // 悬停显示控制面板
        this.setupHoverListeners();

        // 播放/暂停按钮
        this.playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlayback();
        });

        // 监听用户首次交互恢复声音
        this.setupUserInteractionListener();

        // 视频事件监听
        this.bgVideo.addEventListener('ended', () => {
            console.log('视频播放结束（循环中）');
            this.playPauseBtn.textContent = '⏸️ 等待中...';
            this.playPauseBtn.style.background = '#666';
            setTimeout(() => this.playVideo(), 100);
        });

        this.bgVideo.addEventListener('error', (e) => {
            alert('❌ 视频加载失败，请检查文件是否存在');
        });

        // 自动尝试播放
        this.attemptInitialPlayback();
    }

    setupHoverListeners() {
        this.hoverZone.addEventListener('mouseenter', () => {
            this.videoControl.classList.add('show');
        });

        this.videoControl.addEventListener('mouseleave', () => {
            setTimeout(() => {
                this.videoControl.classList.remove('show');
            }, 200);
        });
    }

    setupUserInteractionListener() {
        const restoreSound = () => {
            if (!this.soundRestored && this.bgVideo.src) {
                this.bgVideo.muted = false;
                this.soundRestored = true;
                console.log('🔊 用户交互后声音已恢复');
            }
        };
        const options = { once: true };
        document.addEventListener('click', restoreSound, options);
        document.addEventListener('mousemove', restoreSound, options);
    }

    attemptInitialPlayback() {
        this.playVideo().then(() => {
            console.log('✅ 视频自动播放成功');
        }).catch(() => {
            console.log('⚠️ 自动播放失败，等待用户交互');
            this.playPauseBtn.textContent = '▶️ 播放';
            this.playPauseBtn.style.background = '#c41e3a';
        });
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.pauseVideo();
        } else {
            this.playVideo();
        }
    }

    playVideo() {
        if (!this.bgVideo.src) return Promise.reject();

        this.userPaused = false;

        return this.bgVideo.play().then(() => {
            this.playPauseBtn.textContent = '⏸️ 暂停';
            this.playPauseBtn.style.background = '#0a5f38';
            this.isPlaying = true;
        }).catch(e => {
            this.playPauseBtn.textContent = '▶️ 播放';
            this.playPauseBtn.style.background = '#c41e3a';
            this.isPlaying = false;
        });
    }

    pauseVideo() {
        this.userPaused = true;
        this.bgVideo.pause();
        this.playPauseBtn.textContent = '▶️ 播放';
        this.playPauseBtn.style.background = '#c41e3a';
        this.isPlaying = false;
    }
}

// =========================================
// 二维码生成类
// =========================================
class QRCodeGenerator {
    constructor() {
        const currentURL = window.location.href;
        this.generateQR(currentURL);
    }

    generateQR(url) {
        new QRCode(document.getElementById("qrcode"), {
            text: url,
            width: 180,
            height: 180,
            colorDark: "#c41e3a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// =========================================
// 初始化所有功能
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const snow = new SnowAnimation();
    const mouseTrail = new MouseTrail();
    const qr = new QRCodeGenerator();
    const video = new VideoController();
    video.init();
    console.log('🎬 完整版圣诞节网站初始化完成！');
});
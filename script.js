// =========================================
// 圣诞节网站交互脚本 - 鼠标不暂停修复版
// =========================================

// 雪花和鼠标配置
const SNOW_CONFIG = {
    density: 250, speed: 5, minSize: 3, maxSize: 10, color: 'rgba(255, 255, 255, 0.8)'
};

const MOUSE_TRAIL_CONFIG = {
    interval: 50,        // 减少间隔时间，增加密度
    fadeDuration: 3500,  // 增加停留时间
    icons: ['🎁', '🍬', '🦌', '⭐', '❄️', '🎀', '🧸', '🎄']
};

// 存储配置
const STORAGE_CONFIG = {
    key: 'christmasVideoData',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天有效期
};

// 雪花动画类
class SnowAnimation {
    // ...保持不变...
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
    // ...保持不变...
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
// 视频控制类 - 完整优化版
// =========================================
class VideoController {
    constructor() {
        this.videoFile = document.getElementById('videoFile');
        this.bgVideo = document.getElementById('bgVideo');
        this.playPauseBtn = document.getElementById('playPause');
        this.videoControl = document.querySelector('.video-control');
        this.videoPlaceholder = document.querySelector('.video-placeholder');
        this.hoverZone = document.querySelector('.hover-trigger-zone');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.guideTooltip = document.getElementById('guideTooltip');
        this.isPlaying = false;
        this.loopTimeout = null;
        this.soundRestored = false;
        this.panelVisible = false;
        this.userPaused = false;
        this.hideTimeout = null;

        // 设置初始音量
        this.bgVideo.volume = 0.8; // 80%

        this.init();
    }

    init() {
        this.restoreVideoFromStorage();

        // 文件上传事件
        this.videoFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('video/')) {
                this.saveVideoToStorage(file);
                this.loadVideoFromFile(file);
            } else {
                alert('请选择有效的视频文件！');
            }
        });

        // 悬停监听逻辑
        this.setupHoverListeners();

        // 播放/暂停按钮
        this.playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.togglePlayback();
        });

        // 音量控制
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.bgVideo.volume = volume;
            this.volumeValue.textContent = e.target.value + '%';
            console.log('🔊 音量设置为:', e.target.value + '%');
        });

        // 视频结束自动循环
        this.bgVideo.addEventListener('ended', () => {
            this.handleVideoEnd();
        });

        // 防止意外暂停
        this.bgVideo.addEventListener('pause', (e) => {
            if (this.isPlaying && !this.userPaused) {
                console.log('⚠️ 检测到意外暂停，正在恢复...');
                setTimeout(() => this.playVideo(), 50);
            }
        });

        // 错误处理
        this.bgVideo.addEventListener('error', (e) => {
            console.error('视频加载错误:', e);
            alert('❌ 视频加载失败，请检查文件格式');
            this.resetPlayer();
        });

        // 视频加载完成
        this.bgVideo.addEventListener('loadeddata', () => {
            console.log('✅ 视频加载成功');
            this.videoPlaceholder.style.display = 'none';
        });
    }

    // 悬停监听逻辑
    setupHoverListeners() {
        this.hoverZone.addEventListener('mouseenter', () => {
            clearTimeout(this.hideTimeout);
            this.panelVisible = true;
            this.videoControl.classList.add('show');
            this.videoControl.classList.remove('hidden');

            // 隐藏引导提示
            if (this.guideTooltip) {
                this.guideTooltip.classList.add('hidden');
            }
        });

        this.videoControl.addEventListener('mouseenter', () => {
            clearTimeout(this.hideTimeout);
            this.panelVisible = true;
        });

        this.hoverZone.addEventListener('mouseleave', (e) => {
            if (!this.videoControl.contains(e.relatedTarget)) {
                this.scheduleHide();
            }
        });

        this.videoControl.addEventListener('mouseleave', (e) => {
            if (!this.hoverZone.contains(e.relatedTarget)) {
                this.scheduleHide();
            }
        });
    }

    scheduleHide() {
        this.panelVisible = false;
        this.hideTimeout = setTimeout(() => {
            this.videoControl.classList.remove('show');
        }, 300);
    }

    // 播放/暂停切换
    togglePlayback() {
        if (this.isPlaying) {
            this.pauseVideo();
        } else {
            this.playVideo();
        }
    }

    // 暂停视频
    pauseVideo() {
        this.userPaused = true;
        this.bgVideo.pause();
        this.playPauseBtn.textContent = '▶️ 播放';
        this.playPauseBtn.style.background = '#c41e3a';
        this.isPlaying = false;
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
    }

    // 播放视频
    playVideo() {
        if (!this.bgVideo.src) {
            console.warn('⚠️ 没有视频源');
            return Promise.reject('No video source');
        }

        this.userPaused = false;

        return this.bgVideo.play().then(() => {
            this.playPauseBtn.textContent = '⏸️ 暂停';
            this.playPauseBtn.style.background = '#0a5f38';
            this.isPlaying = true;
            console.log('✅ 视频播放中');
        }).catch(e => {
            console.warn('⚠️ 播放被阻止:', e.message);
            this.playPauseBtn.textContent = '▶️ 播放';
            this.playPauseBtn.style.background = '#c41e3a';
            this.isPlaying = false;
        });
    }

    // 从文件加载视频
    loadVideoFromFile(file) {
        const url = URL.createObjectURL(file);
        this.bgVideo.src = url;
        this.bgVideo.loop = true; // 启用原生循环，避免卡顿
        this.videoPlaceholder.style.display = 'none';

        // 隐藏引导提示（用户已经知道如何使用了）
        if (this.guideTooltip) {
            this.guideTooltip.classList.add('hidden');
        }

        // 等待视频加载完成后自动播放
        const onLoadedData = () => {
            console.log('✅ 视频数据加载完成，开始播放');
            this.playVideo();
            this.bgVideo.removeEventListener('loadeddata', onLoadedData);
        };

        this.bgVideo.addEventListener('loadeddata', onLoadedData);
        this.bgVideo.load();
    }

    // 保存视频到 LocalStorage
    saveVideoToStorage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const videoData = {
                    data: e.target.result,
                    name: file.name,
                    type: file.type,
                    timestamp: Date.now()
                };
                localStorage.setItem(STORAGE_CONFIG.key, JSON.stringify(videoData));
                console.log('✅ 视频已保存到本地存储');
            } catch (error) {
                console.error('❌ 保存视频失败（可能文件过大）:', error);
                alert('视频文件过大，无法保存到本地存储。建议使用小于5MB的视频。');
            }
        };
        reader.readAsDataURL(file);
    }

    // 从 LocalStorage 恢复视频
    restoreVideoFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_CONFIG.key);
            if (!stored) return;

            const videoData = JSON.parse(stored);

            // 检查是否过期
            if (Date.now() - videoData.timestamp > STORAGE_CONFIG.maxAge) {
                localStorage.removeItem(STORAGE_CONFIG.key);
                console.log('⏰ 存储的视频已过期');
                return;
            }

            // 恢复视频
            this.bgVideo.src = videoData.data;
            this.bgVideo.loop = true; // 启用原生循环
            this.videoPlaceholder.style.display = 'none';
            console.log('✅ 已从本地存储恢复视频:', videoData.name);

            // 等待视频加载完成后自动播放
            const onLoadedData = () => {
                console.log('✅ 恢复的视频加载完成，开始播放');
                this.playVideo();
                this.bgVideo.removeEventListener('loadeddata', onLoadedData);
            };

            this.bgVideo.addEventListener('loadeddata', onLoadedData);
            this.bgVideo.load();
        } catch (error) {
            console.error('❌ 恢复视频失败:', error);
            localStorage.removeItem(STORAGE_CONFIG.key);
        }
    }

    // 视频结束处理（使用原生 loop 时不再需要手动处理）
    handleVideoEnd() {
        // 由于使用了 video.loop = true，视频会自动循环
        // 这个方法保留以防需要其他逻辑
        console.log('🔄 视频播放结束（自动循环中）');
    }

    // 重置播放器
    resetPlayer() {
        this.bgVideo.src = '';
        this.videoPlaceholder.style.display = 'flex';
        this.playPauseBtn.textContent = '▶️ 播放';
        this.playPauseBtn.style.background = '#c41e3a';
        this.isPlaying = false;
        this.userPaused = false;
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
        localStorage.removeItem(STORAGE_CONFIG.key);
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
    const video = new VideoController();
    const qr = new QRCodeGenerator();
    console.log('🎬 左侧悬停修复版初始化完成！');
});
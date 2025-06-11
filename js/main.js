console.log("\n %c HeoMusic 开源静态音乐播放器 %c https://github.com/zhheo/HeoMusic \n", "color: #fadfa3; background: #030307; padding:5px 0;", "background: #fadfa3; padding:5px 0;")
var local = false;
var isScrolling = false; // 添加全局变量 isScrolling，默认为 false
var scrollTimer = null; // 添加定时器变量
var animationFrameId = null; // 添加变量用于跟踪动画帧ID

if (typeof userId === 'undefined') {
  var userId = "8152976493"; // 替换为实际的默认值
}
if (typeof userServer === 'undefined') {
  var userServer = "netease"; // 替换为实际的默认值
}
if (typeof userType === 'undefined') {
  var userType = "playlist"; // 替换为实际的默认值
}

if (typeof remoteMusic !== 'undefined' && remoteMusic) {
  fetch(remoteMusic)
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        localMusic = data;
      }
      loadMusicScript();
    })
    .catch(error => {
      console.error('Error fetching remoteMusic:', error);
      loadMusicScript();
    });
} else {
  loadMusicScript();
}

function loadMusicScript() {
  if (typeof localMusic === 'undefined' || !Array.isArray(localMusic) || localMusic.length === 0) {
    // 如果 localMusic 为空数组或未定义，加载 Meting2.min.js
    var script = document.createElement('script');
    script.src = './js/Meting.js';
    document.body.appendChild(script);
  } else {
    // 否则加载 localEngine.js
    var script = document.createElement('script');
    script.src = './js/localEngine.js';
    document.body.appendChild(script);
    local = true;
  }
}

var volume = 0.8;

// 获取地址栏参数
// 创建URLSearchParams对象并传入URL中的查询字符串
const params = new URLSearchParams(window.location.search);

var heo = {
  // 处理滚动和触摸事件的通用方法
  handleScrollOrTouch: function(event, isTouchEvent) {
    // 检查事件的目标元素是否在相关区域内部
    let targetElement = event.target;
    let isInTargetArea = false;
    
    // 向上遍历DOM树，检查是否在目标区域内
    while (targetElement && targetElement !== document) {
      if (targetElement.classList) {
        if (isTouchEvent) {
          // 触摸事件检查 aplayer-body 或 aplayer-lrc
          if (targetElement.classList.contains('aplayer-body') || 
              targetElement.classList.contains('aplayer-lrc')) {
            isInTargetArea = true;
            break;
          }
        } else {
          // 鼠标滚轮事件只检查 aplayer-body
          if (targetElement.classList.contains('aplayer-body')) {
            isInTargetArea = true;
            break;
          }
        }
      }
      targetElement = targetElement.parentNode;
    }
    
    // 只有当在目标区域内时才改变 isScrolling
    if (isInTargetArea) {
      // 取消任何正在进行的动画
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      // 设置isScrolling为true
      isScrolling = true;
      
      // 清除之前的定时器
      if(scrollTimer !== null) {
        clearTimeout(scrollTimer);
      }
      
      // 设置新的定时器，恢复isScrolling为false
      // 触摸事件给予更长的时间
      const timeoutDuration = isTouchEvent ? 4500 : 4000;
      scrollTimer = setTimeout(function() {
        isScrolling = false;
        heo.scrollLyric();
      }, timeoutDuration);
    }
  },
  
  // 初始化滚动和触摸事件
  initScrollEvents: function() {
    // 监听鼠标滚轮事件
    document.addEventListener('wheel', (event) => {
      this.handleScrollOrTouch(event, false);
    }, { passive: true });
    
    // 监听触摸滑动事件
    document.addEventListener('touchmove', (event) => {
      this.handleScrollOrTouch(event, true);
    }, { passive: true });
  },

  scrollLyric: function () {
    // 当 isScrolling 为 true 时，跳过执行
    if (isScrolling) {
      return;
    }
    
    const lrcContent = document.querySelector('.aplayer-lrc');
    const currentLyric = document.querySelector('.aplayer-lrc-current');

    if (lrcContent && currentLyric) {
      let startScrollTop = lrcContent.scrollTop;
      let targetScrollTop = currentLyric.offsetTop - (window.innerHeight - 150) * 0.3; // 目标位置在30%的dvh位置
      let distance = targetScrollTop - startScrollTop;
      let duration = 600; // 缩短动画时间以提高流畅度
      let startTime = null;

      function easeOutQuad(t) {
        return t * (2 - t);
      }

      function animateScroll(currentTime) {
        // 如果用户正在手动滚动，停止动画
        if (isScrolling) {
          animationFrameId = null;
          return;
        }
        
        if (startTime === null) startTime = currentTime;
        let timeElapsed = currentTime - startTime;
        let progress = Math.min(timeElapsed / duration, 1);
        let easeProgress = window.innerWidth < 768 ? progress : easeOutQuad(progress);
        lrcContent.scrollTop = startScrollTop + (distance * easeProgress);
        
        if (timeElapsed < duration) {
          animationFrameId = requestAnimationFrame(animateScroll);
        } else {
          animationFrameId = null;
        }
      }

      // 取消任何正在进行的动画
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(animateScroll);
    }
  },

  getCustomPlayList: function () {
    const heoMusicPage = document.getElementById("heoMusic-page");
    const playlistType = params.get("type") || "playlist";

    if (params.get("id") && params.get("server")) {
      console.log("获取到自定义内容")
      var id = params.get("id")
      var server = params.get("server")
      heoMusicPage.innerHTML = `<meting-js id="${id}" server="${server}" type="${playlistType}" mutex="true" preload="auto" order="random"></meting-js>`;
    } else {
      console.log("无自定义内容")
      heoMusicPage.innerHTML = `<meting-js id="${userId}" server="${userServer}" type="${userType}" mutex="true" preload="auto" order="random"></meting-js>`;
    }
  },

  bindEvents: function () {
    var e = this;
    // 添加歌词点击件
    if (this.lrc) {
      this.template.lrc.addEventListener('click', function (event) {
        // 确保点击的是歌词 p 元素
        var target = event.target;
        if (target.tagName.toLowerCase() === 'p') {
          // 获取所有歌词元素
          var lyrics = e.template.lrc.getElementsByTagName('p');
          // 找到被点击歌词的索引
          for (var i = 0; i < lyrics.length; i++) {
            if (lyrics[i] === target) {
              // 获取对应时间并跳转
              if (e.lrc.current[i]) {
                var time = e.lrc.current[i][0];
                e.seek(time);
                if (e.paused) {
                  e.play();
                }
              }
              break;
            }
          }
        }
      });
    }
  },
  // 添加新方法处理歌词点击
  addLyricClickEvent: function () {
    const lrcContent = document.querySelector('.aplayer-lrc-contents');

    if (lrcContent) {
      lrcContent.addEventListener('click', function (event) {
        if (event.target.tagName.toLowerCase() === 'p') {
          const lyrics = lrcContent.getElementsByTagName('p');
          for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i] === event.target) {
              // 获取当前播放器实例
              const player = ap;
              // 使用播放器内部的歌词数据
              if (player.lrc.current[i]) {
                const time = player.lrc.current[i][0];
                player.seek(time);
                // 点击歌词后不再等待4s，立即跳转
                isScrolling = false;
                clearTimeout(scrollTimer);
                // 如果当前是暂停状态,则恢复播放
                if (player.paused) {
                  player.play();
                }
              }
              event.stopPropagation(); // 阻止事件冒泡
              break;
            }
          }
        }
      });
    }
  },
  setMediaMetadata: function (aplayerObj, isSongPlaying) {
    const audio = aplayerObj.list.audios[aplayerObj.list.index]
    const coverUrl = audio.cover || './img/icon.webp';
    const currentLrcContent = document.getElementById("heoMusic-page").querySelector(".aplayer-lrc-current").textContent;
    let songName, songArtist;

    if ('mediaSession' in navigator) {
      if (isSongPlaying && currentLrcContent) {
        songName = currentLrcContent;
        songArtist = `${audio.artist} / ${audio.name}`;
      } else {
        songName = audio.name;
        songArtist = audio.artist;
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songName,
        artist: songArtist,
        album: audio.album,
        artwork: [
          { src: coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: coverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } else {
      console.log('当前浏览器不支持 Media Session API');
      document.title = `${audio.name} - ${audio.artist}`;
    }
  },
  // 响应 MediaSession 标准媒体交互
  setupMediaSessionHandlers: function (aplayer) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        aplayer.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        aplayer.pause();
      });

      // 移除快进快退按钮
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);

      // 设置上一曲下一曲按钮
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        aplayer.skipBack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        aplayer.skipForward();
      });

      // 响应进度条拖动
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.fastSeek && 'fastSeek' in aplayer.audio) {
          aplayer.audio.fastSeek(details.seekTime);
        } else {
          aplayer.audio.currentTime = details.seekTime;
        }
      });

      // 更新 Media Session 元数据
      aplayer.on('loadeddata', () => {
        heo.setMediaMetadata(aplayer, false);
      });

      // 更新播放状态
      aplayer.on('play', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
          heo.setMediaMetadata(aplayer, true);
        }
      });

      aplayer.on('pause', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
          heo.setMediaMetadata(aplayer, false);
        }
      });

      // 监听时间更新事件
      aplayer.on('timeupdate', () => {
        heo.setMediaMetadata(aplayer, true);
      });
    }
  },
  updateThemeColorWithImage(img) {
    if (local) {
      const updateThemeColor = (colorThief) => {
        const dominantColor = colorThief.getColor(img);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          // 叠加rgba(0,0,0,0.4)的效果
          const r = Math.round(dominantColor[0] * 0.6); // 原色 * 0.6 实现叠加黑色透明度0.4的效果
          const g = Math.round(dominantColor[1] * 0.6);
          const b = Math.round(dominantColor[2] * 0.6);
          metaThemeColor.setAttribute('content', `rgb(${r},${g},${b})`);
        }
      };

      if (typeof ColorThief === 'undefined') {
        const script = document.createElement('script');
        script.src = './js/color-thief.min.js';
        script.onload = () => updateThemeColor(new ColorThief());
        document.body.appendChild(script);
      } else {
        updateThemeColor(new ColorThief());
      }
    }

  },
  
  // 新增方法：将歌词滚动到顶部
  scrollLyricToTop: function() {
    const lrcContent = document.querySelector('.aplayer-lrc');
    if (lrcContent) {
      // 使用平滑滚动效果，但不过于缓慢
      lrcContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  },

  // 添加下载功能
  downloadCurrentSong: function() {
    if (!window.ap || !window.ap.list || !window.ap.list.audios) {
      console.error('播放器未初始化或没有音乐列表');
      return;
    }

    const currentAudio = window.ap.list.audios[window.ap.list.index];
    if (!currentAudio) {
      console.error('没有当前播放的音乐');
      return;
    }

    // 检查是否为本地音乐或允许下载的音乐
    if (local || this.isDownloadAllowed(currentAudio.url)) {
      this.performDownload(currentAudio);
    } else {
      // 对于在线音乐，显示提示信息
      this.showDownloadNotice();
    }
  },

  // 检查是否允许下载
  isDownloadAllowed: function(url) {
    // 检查是否为本地文件或外链文件
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true; // 本地文件
    }

    // 检查是否为允许下载的外链（可以根据需要添加白名单域名）
    const allowedDomains = [
      // 可以在这里添加允许下载的域名
      'your-domain.com',
      'cdn.example.com'
    ];

    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (e) {
      return false;
    }
  },

  // 执行下载
  performDownload: function(audio) {
    const fileName = `${audio.artist} - ${audio.name}.mp3`;

    // 尝试高级下载方法（从缓存获取）
    if (this.tryAdvancedDownload(audio, fileName)) {
      return;
    }

    // 回退到传统下载方法
    this.performSimpleDownload(audio.url, fileName);
  },

  // 尝试从浏览器缓存或当前播放器获取音频数据
  tryAdvancedDownload: function(audio, fileName) {
    try {
      // 检查是否是当前正在播放的音频
      if (window.ap && window.ap.audio && window.ap.audio.src === audio.url) {
        // 如果音频已经加载完成，尝试从audio元素获取数据
        if (window.ap.audio.readyState >= 3) { // HAVE_FUTURE_DATA 或更高
          return this.downloadFromAudioElement(window.ap.audio, fileName);
        }
      }

      // 尝试通过fetch获取（可能从缓存读取）
      return this.downloadWithFetch(audio.url, fileName);
    } catch (error) {
      console.log('高级下载方法失败，使用传统方法:', error);
      return false;
    }
  },

  // 从audio元素下载（实验性功能）
  downloadFromAudioElement: function(audioElement, fileName) {
    try {
      // 注意：由于CORS限制，这种方法可能不总是有效
      // 主要适用于同源的音频文件

      // 创建一个新的audio元素来避免影响播放
      const tempAudio = new Audio();
      tempAudio.crossOrigin = 'anonymous';
      tempAudio.src = audioElement.src;

      tempAudio.addEventListener('loadeddata', () => {
        // 这里可以尝试获取音频数据，但受CORS限制
        this.performSimpleDownload(audioElement.src, fileName);
      });

      tempAudio.addEventListener('error', () => {
        this.performSimpleDownload(audioElement.src, fileName);
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  // 使用fetch下载（可能从缓存读取）
  downloadWithFetch: function(url, fileName) {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('网络响应不正常');
        }
        return response.blob();
      })
      .then(blob => {
        // 创建blob URL并下载
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 清理blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        this.showDownloadSuccess(fileName);
      })
      .catch(error => {
        console.log('Fetch下载失败，使用传统方法:', error);
        this.performSimpleDownload(url, fileName);
      });

    return true;
  },

  // 传统的简单下载方法
  performSimpleDownload: function(url, fileName) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    // 添加到DOM并点击
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);

    // 显示下载提示
    this.showDownloadSuccess(fileName);
  },

  // 显示下载成功提示
  showDownloadSuccess: function(fileName) {
    // 创建提示元素
    const notice = document.createElement('div');
    notice.className = 'download-notice success';
    notice.innerHTML = `
      <div class="notice-content">
        <i class="notice-icon">✓</i>
        <span>开始下载: ${fileName}</span>
      </div>
    `;

    // 添加样式
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notice);

    // 3秒后自动移除
    setTimeout(() => {
      if (notice.parentNode) {
        notice.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          document.body.removeChild(notice);
        }, 300);
      }
    }, 3000);
  },

  // 显示不支持下载的提示
  showDownloadNotice: function() {
    const notice = document.createElement('div');
    notice.className = 'download-notice warning';
    notice.innerHTML = `
      <div class="notice-content">
        <i class="notice-icon">⚠</i>
        <span>当前歌曲不支持下载</span>
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
          仅支持下载本地音乐文件
        </div>
      </div>
    `;

    notice.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #FF9800;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notice);

    setTimeout(() => {
      if (notice.parentNode) {
        notice.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          document.body.removeChild(notice);
        }, 300);
      }
    }, 4000);
  },

  // 添加下载按钮到播放器
  addDownloadButton: function() {
    // 等待播放器加载完成
    const checkPlayer = () => {
      const playerContainer = document.querySelector('.aplayer');
      const controllerBar = document.querySelector('.aplayer-controller');

      if (playerContainer && controllerBar && !document.querySelector('.download-btn')) {
        // 创建下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        `;
        downloadBtn.title = '下载当前歌曲';

        // 添加样式
        downloadBtn.style.cssText = `
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 8px;
          margin: 0 4px;
          border-radius: 4px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        // 添加悬停效果
        downloadBtn.addEventListener('mouseenter', () => {
          downloadBtn.style.color = '#333';
          downloadBtn.style.background = 'rgba(0,0,0,0.1)';
        });

        downloadBtn.addEventListener('mouseleave', () => {
          downloadBtn.style.color = '#666';
          downloadBtn.style.background = 'none';
        });

        // 添加点击事件
        downloadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.downloadCurrentSong();
        });

        // 将按钮添加到控制栏
        const volumeButton = controllerBar.querySelector('.aplayer-volume-wrap') ||
                           controllerBar.querySelector('.aplayer-time');
        if (volumeButton) {
          volumeButton.parentNode.insertBefore(downloadBtn, volumeButton);
        } else {
          controllerBar.appendChild(downloadBtn);
        }

        // 添加音频加载状态监控（调试用）
        this.addAudioLoadingMonitor();
      } else if (!playerContainer || !controllerBar) {
        // 如果播放器还没加载完成，继续等待
        setTimeout(checkPlayer, 100);
      }
    };

    checkPlayer();
  },

  // 添加音频加载状态监控（调试功能）
  addAudioLoadingMonitor: function() {
    if (!window.ap || !window.ap.audio) return;

    const audio = window.ap.audio;
    let monitor = null;

    // 创建监控面板（仅在开发模式下显示）
    if (window.location.search.includes('debug=true')) {
      monitor = document.createElement('div');
      monitor.id = 'audio-monitor';
      monitor.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10001;
        min-width: 200px;
      `;
      document.body.appendChild(monitor);
    }

    // 监听音频加载事件
    const updateMonitor = () => {
      if (!monitor) return;

      const readyStates = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
      const networkStates = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'];

      monitor.innerHTML = `
        <div><strong>音频加载状态</strong></div>
        <div>Ready State: ${readyStates[audio.readyState] || audio.readyState}</div>
        <div>Network State: ${networkStates[audio.networkState] || audio.networkState}</div>
        <div>Duration: ${audio.duration ? audio.duration.toFixed(2) + 's' : 'Unknown'}</div>
        <div>Buffered: ${audio.buffered.length > 0 ? (audio.buffered.end(0) / audio.duration * 100).toFixed(1) + '%' : '0%'}</div>
        <div>Current Time: ${audio.currentTime.toFixed(2)}s</div>
        <div>Preload: ${audio.preload}</div>
        <div>Can Download: ${this.isDownloadAllowed(audio.src) ? 'Yes' : 'No'}</div>
      `;
    };

    // 绑定事件监听器
    const events = ['loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'progress', 'canplay', 'canplaythrough'];
    events.forEach(event => {
      audio.addEventListener(event, updateMonitor);
    });

    // 定期更新
    setInterval(updateMonitor, 1000);
    updateMonitor();
  },
  
  // 初始化所有事件
  init: function() {
    this.getCustomPlayList();
    this.initScrollEvents();
    // 延迟添加下载按钮，确保播放器已经初始化
    setTimeout(() => {
      this.addDownloadButton();
    }, 1000);
  }
}

//空格控制音乐
document.addEventListener("keydown", function (event) {
  //暂停开启音乐
  if (event.code === "Space") {
    event.preventDefault();
    ap.toggle();

  };
  //切换下一曲
  if (event.keyCode === 39) {
    event.preventDefault();
    ap.skipForward();

  };
  //切换上一曲
  if (event.keyCode === 37) {
    event.preventDefault();
    ap.skipBack();

  }
  //增加音量
  if (event.keyCode === 38) {
    if (volume <= 1) {
      volume += 0.1;
      ap.volume(volume, true);

    }
  }
  //减小音量
  if (event.keyCode === 40) {
    if (volume >= 0) {
      volume += -0.1;
      ap.volume(volume, true);

    }
  }
  //下载当前歌曲 (Ctrl+D 或 Cmd+D)
  if ((event.ctrlKey || event.metaKey) && event.keyCode === 68) {
    event.preventDefault();
    heo.downloadCurrentSong();
  }
});

// 监听窗口大小变化
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) {
    ap.list.show();
  } else {
    ap.list.hide();
  }

});

// 调用初始化
heo.init();


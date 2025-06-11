var userId = "8668419170";
var userServer = "tencent";
var userType = "playlist";

// 本地音乐配置 - 支持下载功能
var localMusic = [{
    name: '示例歌曲1',
    artist: '示例歌手1',
    url: './music/song1.mp3',
    cover: './music/cover1.jpg',
    lrc: './music/song1.lrc'
},
{
    name: '示例歌曲2',
    artist: '示例歌手2',
    url: './music/song2.mp3',
    cover: './music/cover2.jpg',
    lrc: './music/song2.lrc'
},
{
    name: '测试下载功能',
    artist: '本地歌手',
    url: 'https://music.163.com/song/media/outer/url?id=1901371647.mp3',
    cover: './img/cover.webp',
    lrc: '[00:00.00]这是一首测试歌曲\n[00:05.00]用于测试下载功能\n[00:10.00]请点击下载按钮或按 Ctrl+D'
}];

// 使用说明：
// 1. 这个配置文件专门用于测试本地音乐和下载功能
// 2. 要使用这个配置，请将 index.html 中的 config.js 改为 config-local.js
// 3. 或者将这个文件的内容复制到 config.js 中

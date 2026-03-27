# Together - 校园社交平台

> 融合 Discord 社群功能与社交网络的新一代校园平台

## ✨ 功能特性

- **动态广场** — 发布帖子、上传图片、添加链接，支持 AI 智能优化文案
- **群组社区** — 创建/加入兴趣群组，多频道聊天，内置 AI 助手
- **私信系统** — 一对一实时聊天，支持置顶/静音/搜索对话
- **发现探索** — 浏览推荐群组，按分类筛选，一键加入
- **个人主页** — 自定义封面、编辑资料、好友列表、徽章系统
- **身份认证** — 支持学校和企业认证，连接真实社区
- **主题定制** — 多种深色主题配色方案供选择

## 🛠️ 技术栈

- **框架**: React 19 + TypeScript
- **构建**: Vite 6
- **样式**: Tailwind CSS 4
- **图标**: Lucide React
- **AI**: 本地模拟服务（无外部 API 依赖，零隐私风险）

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm run preview
```

## 📁 项目结构

```
together/
├── index.html          # 入口 HTML
├── index.css           # 全局样式 + Tailwind
├── index.tsx           # React 入口
├── App.tsx             # 主应用组件
├── types.ts            # TypeScript 类型定义
├── constants.ts        # Mock 数据
├── components/
│   ├── ErrorBoundary.tsx     # 全局错误边界
│   ├── Sidebar.tsx           # 桌面端侧边栏
│   ├── BottomNav.tsx         # 移动端底部导航
│   ├── Feed.tsx              # 动态广场
│   ├── GroupView.tsx         # 群组聊天
│   ├── GroupsMobile.tsx      # 移动端群组列表
│   ├── CreateGroupModal.tsx  # 创建群组弹窗
│   ├── Discovery.tsx         # 发现探索
│   ├── DirectMessages.tsx    # 私信系统
│   └── Profile.tsx           # 个人主页
├── services/
│   └── geminiService.ts      # AI 模拟服务
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 📄 许可证

MIT License
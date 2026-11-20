/**
 * 常用命令速查表：Git / Linux / Docker / NPM。
 * 结构：{ cmd, desc, example? }。
 */

export const GIT_COMMANDS = [
  { cmd: 'git status -s', desc: '简洁工作区状态' },
  { cmd: 'git add -p', desc: '交互式按块暂存（推荐代替全量 add）' },
  { cmd: 'git commit --amend --no-edit', desc: '修正最近一次提交（不打开编辑器）' },
  { cmd: 'git log --oneline --graph --all -20', desc: '图形化查看最近 20 条全分支日志' },
  { cmd: 'git diff --cached', desc: '查看已暂存的改动' },
  { cmd: 'git reset --soft HEAD~1', desc: '撤销最近提交但保留改动与暂存区' },
  { cmd: 'git reset --hard HEAD~1', desc: '彻底丢弃最近提交（危险，不可逆）' },
  { cmd: 'git stash', desc: '暂存当前工作区改动' },
  { cmd: 'git stash pop', desc: '恢复最近一次暂存并删除记录' },
  { cmd: 'git stash list', desc: '查看所有暂存记录' },
  { cmd: 'git checkout -b <branch>', desc: '新建并切换到分支' },
  { cmd: 'git branch -d <branch>', desc: '删除本地分支（-D 强删）' },
  { cmd: 'git push origin <branch>', desc: '推送分支到远程' },
  { cmd: 'git push --force-with-lease', desc: '安全强推（远端有他人提交会拒绝）' },
  { cmd: 'git pull --rebase', desc: '拉取并变基，避免无意义 merge 提交' },
  { cmd: 'git rebase -i HEAD~3', desc: '交互式整理最近 3 条提交（squash/reword/drop）' },
  { cmd: 'git cherry-pick <commit>', desc: '把指定提交摘取到当前分支' },
  { cmd: 'git merge --abort', desc: '取消正在进行的合并' },
  { cmd: 'git remote -v', desc: '查看远程仓库地址' },
  { cmd: 'git reflog', desc: '查看引用日志，找回"丢失"的提交' },
  { cmd: 'git bisect start', desc: '二分法定位引入 bug 的提交' },
  { cmd: 'git blame <file>', desc: '逐行查看文件修改历史与作者' },
  { cmd: 'git tag v1.0.0', desc: '打标签（-a 附注标签更推荐）' },
  { cmd: 'git describe --tags', desc: '查看最近的标签描述' }
]

export const LINUX_COMMANDS = [
  { cmd: 'ls -lah', desc: '人性化显示所有文件（含隐藏）的详细信息' },
  { cmd: 'cd -', desc: '回到上一次所在目录' },
  { cmd: 'pwd', desc: '显示当前绝对路径' },
  { cmd: 'find . -name "*.js" -not -path "*/node_modules/*"', desc: '按名查找文件，排除 node_modules' },
  { cmd: 'grep -rn "text" . --include="*.vue"', desc: '递归搜索文本，仅 *.vue 文件' },
  { cmd: 'du -sh * | sort -h', desc: '当前目录各条目大小并排序' },
  { cmd: 'df -h', desc: '查看磁盘分区使用情况' },
  { cmd: 'ps aux | grep node', desc: '查找 node 进程' },
  { cmd: 'kill -9 <pid>', desc: '强制终止进程（先试 kill <pid>）' },
  { cmd: 'lsof -i :3000', desc: '查看 3000 端口被哪个进程占用' },
  { cmd: 'nc -zv host 443', desc: '测试目标主机端口连通性' },
  { cmd: 'curl -fsSL <url> -o out', desc: '下载文件（失败不输出错误页）' },
  { cmd: 'tar -xzf file.tar.gz', desc: '解压 .tar.gz（-czf 压缩）' },
  { cmd: 'tail -f file.log', desc: '实时跟踪文件末尾追加内容' },
  { cmd: 'head -n 20 file', desc: '查看文件前 20 行' },
  { cmd: 'chmod +x file', desc: '给文件加可执行权限' },
  { cmd: 'chown user:group file', desc: '修改文件属主与属组' },
  { cmd: 'ssh -i key.pem user@host', desc: '用指定私钥登录远程主机' },
  { cmd: 'scp file user@host:/path', desc: '上传文件到远程主机' },
  { cmd: 'rsync -avz --delete src/ user@host:dst/', desc: '增量同步目录（保留权限、压缩传输）' },
  { cmd: 'nohup cmd > out.log 2>&1 &', desc: '后台运行且脱离终端，日志重定向' },
  { cmd: 'crontab -e', desc: '编辑当前用户的定时任务（-l 查看）' },
  { cmd: 'ln -s target link', desc: '创建软链接' },
  { cmd: 'envsubst < template > out', desc: '用环境变量替换模板中的 $VAR' },
  { cmd: 'xargs -I{} cmd {}', desc: '把标准输入逐条作为参数执行命令' },
  { cmd: 'journalctl -u nginx -f', desc: '跟踪 systemd 服务的日志' },
  { cmd: 'time cmd', desc: '统计命令执行耗时' }
]

export const DOCKER_COMMANDS = [
  { cmd: 'docker ps -a', desc: '列出所有容器（含已停止）' },
  { cmd: 'docker images', desc: '列出本地镜像' },
  { cmd: 'docker pull <image>:<tag>', desc: '拉取镜像（不带 tag 默认 latest）' },
  { cmd: 'docker run -d -p 8080:80 --name web <image>', desc: '后台运行容器并映射端口' },
  { cmd: 'docker run --rm -it <image> bash', desc: '临时进入容器（退出即删除）' },
  { cmd: 'docker exec -it <container> bash', desc: '进入正在运行的容器（sh 备选）' },
  { cmd: 'docker logs -f --tail 200 <container>', desc: '跟踪容器日志，先显示最近 200 行' },
  { cmd: 'docker stop <container>', desc: '优雅停止容器' },
  { cmd: 'docker rm <container>', desc: '删除已停止的容器（-f 强删运行中）' },
  { cmd: 'docker rmi <image>', desc: '删除镜像' },
  { cmd: 'docker build -t name:tag .', desc: '根据 Dockerfile 构建镜像' },
  { cmd: 'docker compose up -d', desc: '按 compose 文件后台启动全部服务' },
  { cmd: 'docker compose down', desc: '停止并清理容器/网络（-v 连卷也删）' },
  { cmd: 'docker compose logs -f <service>', desc: '跟踪单个服务日志' },
  { cmd: 'docker compose ps', desc: '查看 compose 服务状态' },
  { cmd: 'docker system prune -a', desc: '清理所有未使用的镜像/容器/网络（谨慎）' },
  { cmd: 'docker system df', desc: '查看 Docker 占用空间' },
  { cmd: 'docker cp <container>:/path ./local', desc: '从容器拷出文件（反向反之）' },
  { cmd: 'docker stats --no-stream', desc: '一次性查看各容器资源占用' },
  { cmd: 'docker inspect <container>', desc: '查看容器完整 JSON 配置' },
  { cmd: 'docker network ls', desc: '列出网络（create/inspect/connect 配套）' },
  { cmd: 'docker volume ls', desc: '列出数据卷' },
  { cmd: 'docker tag <src> <dst>', desc: '给镜像打新标签（常用于推送前重命名）' }
]

export const NPM_COMMANDS = [
  { cmd: 'npm ci', desc: '按 lock 文件严格安装（CI 环境推荐，比 i 快且稳）' },
  { cmd: 'npm run <script>', desc: '运行 package.json 中的脚本' },
  { cmd: 'npm outdated', desc: '检查可升级的依赖' },
  { cmd: 'npm audit fix', desc: '自动修复安全漏洞（--force 谨慎）' },
  { cmd: 'npm ls <pkg>', desc: '查看依赖树中某包的版本与来源' },
  { cmd: 'npm view <pkg> versions --json', desc: '查看包的所有发布版本' },
  { cmd: 'npx <pkg>@latest', desc: '临时执行最新版包，不污染项目依赖' },
  { cmd: 'npm pack', desc: '打出 .tgz 包用于本地验证或发布检查' },
  { cmd: 'npm link', desc: '把当前包软链到全局，便于本地联调' },
  { cmd: 'npm version patch', desc: '升版本号并打 git tag（minor/major 同理）' },
  { cmd: 'npm publish --access public', desc: '发布包到 registry' },
  { cmd: 'npm cache clean --force', desc: '清缓存（解决奇怪的网络/缓存问题）' },
  { cmd: 'npm config get registry', desc: '查看当前 registry 地址' },
  { cmd: 'pnpm add -D <pkg>', desc: 'pnpm 添加开发依赖（workspace 跨包共享）' },
  { cmd: 'pnpm -F <pkg> run build', desc: 'pnpm 在指定 workspace 包内执行脚本' },
  { cmd: 'yarn why <pkg>', desc: '查看为什么安装了某依赖' }
]

export const CMD_TABS = [
  { value: 'git', label: 'Git', data: GIT_COMMANDS },
  { value: 'linux', label: 'Linux', data: LINUX_COMMANDS },
  { value: 'docker', label: 'Docker', data: DOCKER_COMMANDS },
  { value: 'npm', label: 'NPM / pnpm', data: NPM_COMMANDS }
]

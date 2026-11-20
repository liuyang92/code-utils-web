/** 各工具的示例输入，点击“示例”按钮填入。 */
export const SAMPLES = {
  json: `{"name":"code-utils-web","tags":["format","minify"],"version":0.1,"meta":{"private":true,"langs":["json","js","html","css","sql"]},"history":[{"date":"2026-10-22","action":"init"}]}`,
  js: `const groupBy=(arr,fn)=>arr.reduce((acc,item)=>{const key=typeof fn==='function'?fn(item):item[fn];(acc[key]??=[]).push(item);return acc},{});export default groupBy;`,
  html: `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>demo</title></head><body><div id="app" class="container"><h1>标题</h1><p>段落<b>加粗</b></p><ul><li>一</li><li>二</li></ul></div></body></html>`,
  css: `.card{padding:16px;background:#fff;border:1px solid #e3e6eb;border-radius:8px;box-shadow:0 4px 12px rgba(15,23,42,.08)}.card:hover{transform:translateY(-2px)}@media (max-width:900px){.card{padding:12px}}`,
  java: `public class Demo{private final String name;public Demo(String name){this.name=name;}public String greet(){return "Hello, "+name+"!";}public static void main(String[] args){System.out.println(new Demo("world").greet());}}`,
  sql: `select u.id,u.name,count(o.id) as order_count,sum(o.amount) as total from users u left join orders o on o.user_id=u.id where o.created_at>='2026-01-01' and u.status=1 group by u.id,u.name having count(o.id)>0 order by total desc limit 20;`,
  xml: `<?xml version="1.0" encoding="UTF-8"?><project><name>code-utils-web</name><properties><node>24.16.0</node></properties><modules><module>format</module><module>codec</module></modules></project>`,
  markdown: `# 演示文档\n## 列表\n-   一项\n- 二项\n\n    代码片段：\n\n\`\`\`js\nconst a = 1\n\`\`\`\n\n**加粗**和[链接](https://example.com)。`,
  yaml: `server:\n  port: 8080\n  names: [a, b]\nlogging:\n  level: debug\ndatabase:\n  host: localhost\n  port: 3306`,
  base64: '代码百宝箱：格式化、压缩、编解码，一个都不藏广告。',
  url: 'https://www.example.com/search?q=前端 工具&lang=zh&page=1',
  regex: '订单号：A20261021-001，发票张总，金额 ¥1,299.00；\n手机号 13812345678，邮箱 dev@example.com，\n明日 09:30 发货，IP 来自 10.20.30.40。'
}

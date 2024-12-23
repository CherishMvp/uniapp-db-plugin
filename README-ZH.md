# uniapp-db-plugin

> 在 uniapp 应用开发中使用的 SQLite 数据库操作 Hook 插件 📦

## 安装

```sh
pnpm add uniapp-db-plugin
```

## 提示 ✨

> **初始化提示：** 使用 `useSqlite` 初始化表时需要注意默认主键为自增 ID。如需设置其它字段为唯一索引并使用**更新或修改方法**：`INSERT OR REPLACE INTO students (id, name, score) VALUES (1, 'John', 90);`，请使用 `CREATE UNIQUE INDEX "main"."key" ON "xx" ( "key" );` 来设置唯一索引。

## 使用方法 ✨

### 初始化 🧐

```typescript
import { useSqlite } from 'uniapp-db-plugin';

// 使用 Hook 创建 SQLite 实例和常用方法
const { insertBatch, select, sqldelete, sqlite, selectPage, insert, update } = useSqlite(
  'test_table', // 表名
  {
    data: 'TEXT',                      // 表结构
    userName: 'TEXT',
    createdAt: "not null default(datetime(CURRENT_TIMESTAMP,'localtime'))", // 必填字段
    updatedAt: "not null default(datetime(CURRENT_TIMESTAMP,'localtime'))", // 必填字段
  },
  'test_table_id'                      // 主键，默认自增
);
```

### 操作示例

```typescript
// 新增数据
const insertData = () => {
  insert({
    data: '',
    userName: 'cs1',
  })
}

// 更新数据
const updateData = () => {
  const upinfo = { userName: 'xxx', test_table_id: 2 };
  try {
    update(upinfo, 'test_table_id');
  } catch (error) {
    console.log('更新错误:', error);
  }
}

// 删除数据
const deleteData = () => {
  sqldelete({ test_table_id: 3 });
}

// 条件查询
const selectData = () => {
  select("userName='cs1' AND test_table_id > 3").then((res) => {
    console.log('条件查询结果', res);
  });
}

// 执行任意 SQL 语句
sqlite.executeSql("任意 SQL 命令");

// 使用对象键值条件查询
const selectData2 = () => {
  const conditions = {
    userName: ['xxx'],
    test_table_id: '<6',
  };

  select(conditions).then((res) => {
    console.log('条件查询结果', res);
  });
}
```

## API 参考 🚀

### 使用 TypeScript 类型文件查看更详细的类型定义。

## 为什么选择使用此插件? 🤔

- **方便**：封装钩子加快开发效率。
- **模块化**：便于管理的继承模式。
- **易用性**：简单明了的 API 设计。
- **TypeScript**：完全支持类型定义。

## 如何贡献 💪

欢迎社区的贡献！如果您有改进建议或功能提交，请随时开放问题或提交拉取请求。

### 贡献步骤：

1. Fork 仓库
2. 创建新分支以实现您的功能或修复 Bug
3. 提交拉取请求

## 许可证 📜

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 了解详情。

---

👨‍💻 本插件由 [cherishtao](https://github.com/CherishMvp) 开发

感谢您使用 **uniapp-db-plugin**! 😎
```

这个模板更全面地介绍了使用步骤、API 参考以及贡献指南。您可以根据具体功能需要在各个部分的内容里增减细节。确保在实际使用上提供足够的例子和说明，让用户可以轻松集成。
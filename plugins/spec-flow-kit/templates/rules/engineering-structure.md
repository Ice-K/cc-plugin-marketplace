# 工程结构规则

## 目的

描述代码、测试、文档、脚本和生成产物应该放置的位置。

## 源码根目录
```bash
project-name/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/demo/
│   │   │       ├── aspect/
│   │   │       ├── common/
│   │   │       │   ├── constant/
│   │   │       │   ├── enums/
│   │   │       │   ├── exception/
│   │   │       │   └── result/
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── interceptor/
│   │   │       ├── mapper/
│   │   │       │   └── xml/
│   │   │       ├── model/
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   └── response/
│   │   │       │   ├── entity/
│   │   │       │   └── vo/
│   │   │       ├── service/
│   │   │       │   └── impl/
│   │   │       ├── task/
│   │   │       └── util/
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-test.yml
│   │       ├── application-prod.yml
│   │       ├── db/
│   │       └── logback-spring.xml
│   │
│   └── test/
│       └── java/
│           └── com/example/demo/
│
├── pom.xml
└── README.md
```

## 生成产物

- `.spec-flow-kit/` 由 spec-flow-kit 管理。
- 不要将产品源码放入 `.spec-flow-kit/`。

## 执行方式

默认等级：强制（required）  
默认状态：active  
默认执行模式：strict

等级说明：

- 强制（required）：必须满足，在 strict 模式下可作为阻断依据。
- 推荐（recommended）：建议遵守，通常形成改进建议。
- 参考（informational）：提供上下文，不应作为阻断依据。

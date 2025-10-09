<div align='center'>

# f-string

<p align="center">Conditional template literals with automatic dedentation</p>
<p align="center">
  <a href="https://www.npmjs.com/package/f-string" alt="f-string"><img src="https://img.shields.io/npm/dt/f-string?label=f-string"></a> <a href="https://github.com/zirkelc/f-string/actions/workflows/ci.yml" alt="CI"><img src="https://img.shields.io/github/actions/workflow/status/zirkelc/f-string/ci.yml?branch=main"></a>
</p>

</div>

`f-string` provides a template function `f` that allows you to write readable multi-line strings with a powerful If-Else-EndIf control structure and automatic dedentation.

## Installation

```bash
npm install f-string
```

## Usage

Use the `f` template function to create multi-line strings with embedded expressions. Use `If`, `Else`, and `EndIf` to include conditional content.

```typescript
import { f, If, Else, EndIf } from 'f-string';

const history = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
];

const question = 'What is the capital of France?';

const prompt = f`
  You are a helpful assistant.

  ${If(history.length > 0)}
  Conversation history:
  ${history.map((msg) => `- ${msg.role}: ${msg.content}`)}
  ${Else()}
  No conversation history.
  ${EndIf()}

  User question:
  ${question}
`;

console.log(message);
```

```plaintext
You are a helpful assistant.

Conversation history:
- user: Hello
- assistant: Hi there!

User question:
What is the capital of France?
```

### Dedentation

Strips indentation from multi-line strings.

```typescript
import { f, If, EndIf } from 'f-string';

const prompt = f`
      Hello
        World!
          How are you?
      I'm good, thank you!
`;

console.log(dedented);
```

```plaintext
Hello
  World!
    How are you?
I'm good, thank you!
```

### Lazyness

Expressions can be lazily evaluated, so you can use functions to generate content only when needed.

```typescript
import { f, If, EndIf } from 'f-string';

const messages = await getMessages(); 

const prompt = f`
  ${If(messages.length > 0)}
    You have ${messages.length} messages:
    ${() => messages.map((msg) => `- ${msg}`)}
  ${Else()}
    No messages.
  ${EndIf()}
`;

console.log(prompt);
```

```plaintext
You have 1000 messages:
- Message 1
- Message 2
...
- Message 1000
```

## API

### `f` - Template Function

```typescript
f`template ${value} string`
```

### `If(condition)` - Conditional Block

```typescript

${If(condition)}
  content when true
${EndIf()}
```

### `Else()` - Alternative Block

```typescript
${If(condition)}
  content when true
${Else()}
  content when false
${EndIf()}
```

### `EndIf()` - End Conditional

Marks the end of a conditional block. Required for every `If`.

## License

MIT

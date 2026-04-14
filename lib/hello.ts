export function hello(name: string = "World"): string {
  return `Hello, ${name}!`;
}

if (require.main === module) {
  console.log(hello());
}

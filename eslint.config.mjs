import tseslint from 'typescript-eslint';
export default tseslint.config(
 {ignores:['dist/**','node_modules/**','work/**','test-results/**']},
 ...tseslint.configs.recommended,
 {files:['src/**/*.{ts,tsx}'], rules:{'@typescript-eslint/no-explicit-any':'error','no-eval':'error','no-implied-eval':'error'}},
 {files:['tests/**/*.ts'],rules:{'@typescript-eslint/no-explicit-any':'off'}}
);

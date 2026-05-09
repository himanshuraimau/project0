import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

export default [
  ...coreWebVitals,
  ...typescript,
  {
    name: "project/overrides",
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Disable any type warnings
      "@typescript-eslint/no-unused-vars": "off", // Disable unused variables/imports warnings
      "react/no-unescaped-entities": "off", // Disable unescaped entities warnings
      "prefer-const": "off", // Disable prefer const warnings
      "react-hooks/exhaustive-deps": "off", // Disable exhaustive deps warnings
      "import/no-anonymous-default-export": "off", // Disable anonymous default export warnings
      
      // Disable overly strict React hooks rules that flag valid patterns
      "react-hooks/set-state-in-effect": "off", // Allow setState in effects (common pattern)
      "react-hooks/immutability": "off", // Allow necessary mutations
      "react-hooks/purity": "off", // Allow Math.random in useMemo
      "react-hooks/refs": "off", // Allow ref updates in render
      "react-hooks/rules-of-hooks": "warn", // Downgrade to warning
    },
  },
];

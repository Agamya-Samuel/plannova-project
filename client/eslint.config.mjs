import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
    ],
  },
  ...nextConfig,
];

export default eslintConfig;

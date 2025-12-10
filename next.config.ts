import { NextConfig } from "next";

const next_config = {
    // reference: https://kuma-emon.com/it/pc/6049/
    webpack(config, options)
    {
        config.module.rules.push({
            test: /\.(txt)$/,
            type: "asset/source",
        });

        config.module.rules.push({
            test: /\.(glsl)$/,
            type: "asset/source",
        });

        return config;
    },
} satisfies NextConfig

export default next_config
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ATELIER",
    short_name: "ATELIER",
    description: "A factory of agents, in kinetic motion.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0908",
    theme_color: "#E8A33C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

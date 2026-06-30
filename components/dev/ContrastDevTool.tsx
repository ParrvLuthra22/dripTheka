"use client";

import { useEffect } from "react";
import { enableContrastCheck } from "@/lib/dev/contrast-check";

export function ContrastDevTool() {
  useEffect(() => {
    enableContrastCheck();
  }, []);
  return null;
}

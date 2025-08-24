"use client";

import React from "react";

export function PetSprite({ className }: { className?: string }): React.ReactElement {
  return (
    <img
      src="/assets/cat.svg"
      alt="Pet"
      width={120}
      height={120}
      className={`select-none ${className ?? ""}`}
      draggable={false}
    />
  );
}



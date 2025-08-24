"use client";

import React from "react";

export function PetSprite(): JSX.Element {
  return (
    <img
      src="/assets/cat.svg"
      alt="Pet"
      width={120}
      height={120}
      className="select-none"
      draggable={false}
    />
  );
}



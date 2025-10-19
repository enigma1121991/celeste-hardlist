"use client";

import Twemoji from 'react-twemoji'
import React from "react";

interface TwemojiFlagProps {
    code?: string;
}

export function TwemojiFlag({ code }: TwemojiFlagProps) {
  if (!code) return null;

  return (
    <Twemoji options={{ className: 'twemoji' }}>
        <span>{code.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)))}</span>
    </Twemoji>
  );
}
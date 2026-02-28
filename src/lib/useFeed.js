'use client';
import { useState } from 'react';

export function useFeed({ pincode = null, category = null }) {
  return { items: [], loading: false, source: 'no-firebase' };
}
import { createSelector } from "@reduxjs/toolkit";

const selectItems = (state) => state.items;

export const selectActiveItems = createSelector(
  [selectItems],
  (items) => items.filter((item) => item.active)
);

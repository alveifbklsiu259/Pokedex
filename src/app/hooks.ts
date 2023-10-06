import { useSelector, useDispatch, type TypedUseSelectorHook } from "react-redux";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
	state: RootState,
	dispatch: AppDispatch,
	rejectValue: string
}>();
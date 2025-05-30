"use client";
import React, {useEffect} from 'react';
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import {AppDispatch} from "@/lib/store";
import {setCodesiriusLoading} from "@/lib/features/codesirius/codesiriusSlice";

const Home = () => {
    const dispatch = useAppDispatch<AppDispatch>();
    const user = useAppSelector(state => state.codesirius.user);
    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, [dispatch]);

    return (
        <div>
           Welcome {user?.firstName}
        </div>
    );
};

export default Home;

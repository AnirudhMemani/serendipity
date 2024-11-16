import { cn } from "@/lib/utils";
import React from "react";

type TActionButtonProps = {
    title: string;
    onClick?: () => void;
    color?: string;
    className?: string;
};

const ActionButton: React.FC<TActionButtonProps> = ({ title, onClick, className }): JSX.Element => {
    return (
        <React.Fragment>
            <button
                className={cn(
                    "h-full flex-1 cursor-pointer rounded-2xl border-none text-center text-2xl !capitalize outline-none active:translate-y-1",
                    className
                )}
                onClick={onClick}
            >
                {title}
            </button>
        </React.Fragment>
    );
};

export default ActionButton;

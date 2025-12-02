export const bauhausBtn = {
    hover: {
        x: -4,
        y: -4,
        boxShadow: "6px 6px 0px 0px var(--shadow-color)",
        transition: { type: "spring" as const, stiffness: 400, damping: 10 }
    },
    tap: {
        x: 0,
        y: 0,
        boxShadow: "2px 2px 0px 0px var(--shadow-color)",
    }
};

export const bauhausCard = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
};

export const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

export const modal = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 25 }
    },
    exit: {
        scale: 0.9,
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

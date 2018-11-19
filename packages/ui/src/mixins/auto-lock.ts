import { debounce } from "@padlock/core/lib/util.js";
// // import { BaseElement } from "../elements/base.js";
import { app } from "../init.js";

type Constructor<T> = new (...args: any[]) => T;

export function AutoLock<B extends Constructor<HTMLElement>>(baseClass: B) {
    return class extends baseClass {
        _pausedAt: Date | null = null;
        _lockTimeout?: number;

        get _lockDelay() {
            return app.settings.autoLockDelay * 60 * 1000;
        }

        constructor(...args: any[]) {
            super(...args);
            const moved = debounce(() => this._autoLockChanged(), 300);
            document.addEventListener("touchstart", moved, { passive: true });
            document.addEventListener("keydown", moved);
            document.addEventListener("mousemove", moved);
            document.addEventListener("pause", () => this._pause());
            document.addEventListener("resume", () => this._resume());
            app.addEventListener("lock", moved);
            app.addEventListener("unlock", moved);
            app.addEventListener("settings-changed", moved);
        }

        _cancelAutoLock() {
            this._pausedAt = null;
            if (this._lockTimeout) {
                clearTimeout(this._lockTimeout);
            }
            // if (this._lockNotificationTimeout) {
            //     clearTimeout(this._lockNotificationTimeout);
            // }
        }

        // Handler for cordova `pause` event. Records the current time for auto locking when resuming
        _pause() {
            this._pausedAt = new Date();
        }

        // Handler for cordova `resume` event. If auto lock is enabled and the specified time has passed
        // since the app was paused, locks the app
        _resume() {
            if (
                app.settings.autoLock &&
                !app.locked &&
                this._pausedAt &&
                new Date().getTime() - this._pausedAt.getTime() > this._lockDelay
            ) {
                this._doLock();
            }
            this._autoLockChanged();
        }

        _doLock() {
            // TODO: don't lock if app is synching
            app.lock();
        }

        _autoLockChanged() {
            this._cancelAutoLock();
            if (app.settings.autoLock && !app.locked) {
                this._lockTimeout = setTimeout(() => this._doLock(), this._lockDelay);
                // this._lockNotificationTimeout = setTimeout(() => {
                //     if (!this.locked && !this._pausedAt) {
                //         this.notify($l("Auto-lock in 10 seconds"), "info", 3000);
                //     }
                // }, this._lockDelay - 10000);
            }
        }
    };
}
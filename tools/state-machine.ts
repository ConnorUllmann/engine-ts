export interface StateGeneric<T extends any[]> {
    name: string,
    start?: (...args: T) => any,
    update?: (...args: T) => any,
    finish?: (...args: T) => any
}
export interface State extends StateGeneric<[]> {
    start?: () => any,
    update?: () => any,
    finish?: () => any
}

export class StateMachineGeneric<T extends any[]> {
    private readonly args: T;
    constructor(...args: T) {
        this.args = args;
    };

    private readonly states: { [name: string]: StateGeneric<T> } = {};
    public currentStateName: string | null = null;

    public reset(): this {
        const state = this.currentState;
        if(state.finish)
            state.finish(...this.args);
        this.currentStateName = null;
        return this;
    };
    
    public addState(state: StateGeneric<T>): this {
        this.states[state.name] = state;
        return this;
    };
    
    private get currentState(): StateGeneric<T> {
        return this.states[this.currentStateName];
    };
    
    // forceChange = even if we're already in this state, finish & start it again
    public changeState(stateName: string, forceChange=false): this {
        if(!forceChange && stateName === this.currentStateName)
            return this;
        if(!(stateName in this.states))
            throw `Cannot change a StateMachine to a state ('${stateName}') that has not been added to it! Available states are: ${Object.keys(this.states).length <= 0 ? 'n/a' : Object.keys(this.states).join(', ')}`
    
        const statePrev = this.currentState;
        const stateNext = this.states[stateName];
        if(statePrev && statePrev.finish)
            statePrev.finish(...this.args);
        this.currentStateName = stateName;
        if(stateNext && stateNext.start)
            stateNext.start(...this.args);
        return this;
    };
    
    public start(initialStateName: string): this {
        if(Object.keys(this.states).length <= 0)
            throw "Cannot start a StateMachine which has had no states added to it!";
        return this.changeState(initialStateName);
    };
    
    public update(): this {
        const state = this.currentState;
        if(state && state.update)
            state.update(...this.args);
        return this;
    };
}
export class StateMachine extends StateMachineGeneric<[]> {}
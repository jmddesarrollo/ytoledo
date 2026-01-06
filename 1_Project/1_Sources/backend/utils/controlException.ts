export default class ControlException {
    public message: string;
    public code: number;
    public errors?: string[];

    constructor(message: string, code: number, errors?: string[]) {
        this.message = message;
        this.code = code;
        this.errors = errors;
    }
}

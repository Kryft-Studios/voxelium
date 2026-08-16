export type COUNT<
    N extends number,
    A extends unknown[] = [],
    R = never
> =
    A["length"] extends N
        ? R | N
        : COUNT<N, [...A, unknown], R | A["length"]>;

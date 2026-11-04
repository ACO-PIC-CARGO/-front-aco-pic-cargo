import { inject, provide, type InjectionKey } from "vue";

export const HOUSE_SCREEN: InjectionKey<() => string> = Symbol("houseScreen");

export const provideHouseScreen = (screen: () => string) => provide(HOUSE_SCREEN, screen);

export const useHouseScreen = (): string => inject(HOUSE_SCREEN, () => "listHouse")();

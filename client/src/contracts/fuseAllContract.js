/**
 * Контракт «слить все»: один итоговый скин, стоимость от 50% до 300% суммы входных.
 */
export const FUSE_ALL_CONTRACT = {
  id: "fuse-all",
  title: "Слияние инвентаря",
  description:
    "Все скины из инвентаря объединяются в один новый предмет. Итоговая стоимость случайна: от половины до тройной суммы стоимости всех затраченных скинов."
};

/** Доля суммы входа: нижняя граница (50%). */
export const FUSE_RESULT_MIN_RATIO = 0.5;

/** Доля суммы входа: верхняя граница (300%). */
export const FUSE_RESULT_MAX_RATIO = 3;

/** Равномерное случайное значение множителя в отрезке [min, max]. */
export function rollFuseAllOutcome(totalSkinValue) {
  if (totalSkinValue <= 0) return 1;
  const ratio = FUSE_RESULT_MIN_RATIO + Math.random() * (FUSE_RESULT_MAX_RATIO - FUSE_RESULT_MIN_RATIO);
  return Math.max(1, Math.round(totalSkinValue * ratio));
}

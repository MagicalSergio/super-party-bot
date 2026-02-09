export enum ENounWords {
  Product = 'product',
  ProductRange = 'product-range',
  ProductAll = 'product-all',
  Bonus = 'bonus',
  Unavailable = 'unavailable',
  Day = 'day',
  ShopFrom = 'shop-from',
  ShopIn = 'shop-in',
  Second = 'second',
  FoundMale = 'found-male',
}

export namespace ENounWords {
  export function getWords(Noun: ENounWords): string[] {
    switch (Noun) {
      case ENounWords.Product:
        return ['товар', 'товара', 'товаров'];
      case ENounWords.ProductRange:
        return ['товар', 'товаров', 'товаров'];
      case ENounWords.ProductAll:
        return ['товара', 'товаров', 'товаров'];
      case ENounWords.Bonus:
        return ['бонус', 'бонуса', 'бонусов'];
      case ENounWords.Unavailable:
        return ['недоступен', 'недоступны', 'недоступно'];
      case ENounWords.Day:
        return ['день', 'дня', 'дней'];
      case ENounWords.ShopFrom:
        return ['магазина', 'магазинов', 'магазинов'];
      case ENounWords.ShopIn:
        return ['магазине', 'магазинах', 'магазинах'];
      case ENounWords.Second:
        return ['секунду', 'секунды', 'секунд'];
      case ENounWords.FoundMale:
        return ['найден', 'найдено', 'найдено'];
    }
  }

  export const getNoun = (number: number, noun: ENounWords): string => {
    const words = ENounWords.getWords(noun);

    let n: number = Math.abs(number);

    n %= 100;

    if (n >= 5 && n <= 20) {
      return words[2]!;
    }

    n %= 10;

    if (n === 1) {
      return words[0]!;
    }

    if (n >= 2 && n <= 4) {
      return words[1]!;
    }

    return words[2]!;
  };
}

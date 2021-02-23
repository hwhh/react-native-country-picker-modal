import {
  Country,
  CountryCode,
  CountryCodeList,
  FlagType,
  Region,
  Subregion,
  TranslationLanguageCode,
  TranslationLanguageCodeMap,
} from './types'
import Fuse from 'fuse.js'
import {COUNTRIES} from './assets/countires'

const imageJsonUrl =
  'https://xcarpentier.github.io/react-native-country-picker-modal/countries/'

type CountryMap = { [key in CountryCode]: Country }

interface DataCountry {
  emojiCountries?: CountryMap
  imageCountries?: CountryMap
}
const localData: DataCountry = {
  emojiCountries: undefined,
  imageCountries: undefined,
}

export const loadDataAsync = ((data: DataCountry) => (
  dataType: FlagType = FlagType.EMOJI,
): Promise<CountryMap> => {
  return new Promise((resolve, reject) => {
    switch (dataType) {
      case FlagType.FLAT:
        if (!data.imageCountries) {
          fetch(imageJsonUrl)
            .then((response: Response) => response.json())
            .then((remoteData: any) => {
              data.imageCountries = remoteData
              resolve(data.imageCountries)
            })
            .catch(reject)
        } else {
          resolve(data.imageCountries)
        }
        break
      default:
        if (!data.emojiCountries) {
          data.emojiCountries = require('./assets/data/countries-emoji.json')
          resolve(data.emojiCountries)
        } else {
          resolve(data.emojiCountries)
        }
        break
    }
  })
})(localData)

export const getEmojiFlagAsync = async (countryCode: CountryCode = 'FR') => {
  const countries = await loadDataAsync()
  if (!countries) {
    throw new Error('Unable to find emoji because emojiCountries is undefined')
  }
  return countries[countryCode].flag
}

export const getImageFlagAsync = async (countryCode: CountryCode = 'FR') => {
  const countries = await loadDataAsync(FlagType.FLAT)
  if (!countries) {
    throw new Error('Unable to find image because imageCountries is undefined')
  }
  return countries[countryCode].flag
}

export const getCountryNameAsync = async (
  countryCode: CountryCode = 'FR',
  translation: TranslationLanguageCode = 'common',
) => {
  const countries = await loadDataAsync()
  if (!countries) {
    throw new Error('Unable to find image because imageCountries is undefined')
  }

  return countries[countryCode].name
    ? (countries[countryCode].name as TranslationLanguageCodeMap)[translation]
    : (countries[countryCode].name as TranslationLanguageCodeMap)['common']
}

export const getCountryCallingCodeAsync = async (countryCode: CountryCode) => {
  const countries = await loadDataAsync()
  if (!countries) {
    throw new Error('Unable to find image because imageCountries is undefined')
  }
  return countries[countryCode].callingCode[0]
}

export const getCountryCurrencyAsync = async (countryCode: CountryCode) => {
  const countries = await loadDataAsync()
  if (!countries) {
    throw new Error('Unable to find image because imageCountries is undefined')
  }
  return countries[countryCode].currency[0]
}

const isCountryPresent = (countries: { [key in CountryCode]: Country }) => (
  countryCode: CountryCode,
) => !!countries[countryCode]

const isRegion = (region?: Region) => (country: Country) =>
  region ? country.region === region : true

const isSubregion = (subregion?: Subregion) => (country: Country) =>
  subregion ? country.subregion === subregion : true

const isIncluded = (countryCodes?: CountryCode[]) => (country: Country) =>
  countryCodes && countryCodes.length > 0
    ? countryCodes.includes(country.cca2)
    : true

const isExcluded = (excludeCountries?: CountryCode[]) => (country: Country) =>
  excludeCountries && excludeCountries.length > 0
    ? !excludeCountries.includes(country.cca2)
    : true

export const getCountriesAsync = async (
  flagType: FlagType,
  translation: TranslationLanguageCode = 'common',
  region?: Region,
  subregion?: Subregion,
  countryCodes?: CountryCode[],
  excludeCountries?: CountryCode[],
  preferredCountries?: CountryCode[],
  withAlphaFilter?: boolean,
  useNationality?:boolean
): Promise<Country[]> => {
  const countriesRaw = await loadDataAsync(flagType)
  if (!countriesRaw) {
    return []
  }

  if (preferredCountries && !withAlphaFilter) {
    const newCountryCodeList = [...preferredCountries, ...CountryCodeList.filter(code => !preferredCountries.includes(code))]
    return newCountryCodeList.filter(isCountryPresent(countriesRaw))
        .map((cca2: CountryCode) => {
          // @ts-ignore
          if (useNationality && COUNTRIES[cca2] && COUNTRIES[cca2]["Nationality"] !== '?') {
            return ({
              // @ts-ignore
              cca2,
              ...{
                ...countriesRaw[cca2],
                // @ts-ignore
                name:
                    (countriesRaw[cca2].name as TranslationLanguageCodeMap)[
                        translation
                        ] ||
                    (countriesRaw[cca2].name as TranslationLanguageCodeMap)['common'],
              }
            });
          } else {
            return ({
              // @ts-ignore
              cca2,
              ...{
                ...countriesRaw[cca2],
                // @ts-ignore
                name:
                    (countriesRaw[cca2].name as TranslationLanguageCodeMap)[
                        translation
                        ] ||
                    (countriesRaw[cca2].name as TranslationLanguageCodeMap)['common'],
              }
            });
          }
        })
        .filter(isRegion(region))
        .filter(isSubregion(subregion))
        .filter(isIncluded(countryCodes))
        .filter(isExcluded(excludeCountries))
  } else {
    return CountryCodeList.filter(isCountryPresent(countriesRaw))
        .map((cca2: CountryCode) => {
          // @ts-ignore
          if (useNationality && COUNTRIES[cca2] && COUNTRIES[cca2]["Nationality"] !== '?') {
            return ({
              // @ts-ignore
              cca2,
              ...{
                ...countriesRaw[cca2],
                // @ts-ignore
                name: COUNTRIES[cca2]["Nationality"],
              }
            });
          } else {
            return ({
              // @ts-ignore
              cca2,
              ...{
                ...countriesRaw[cca2],
                // @ts-ignore
                name: countriesRaw[cca2].name['common'],
              }
            });
          }
        })
        .filter(isRegion(region))
        .filter(isSubregion(subregion))
        .filter(isIncluded(countryCodes))
        .filter(isExcluded(excludeCountries))
        .filter((thing, index, self) => self.findIndex(t => t.name === thing.name) === index)
        .sort((country1, country2) => country1.name.localeCompare(country2.name))
  }
}

const DEFAULT_FUSE_OPTION = {
  shouldSort: true,
  threshold: 0.3,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['name', 'cca2', 'callingCode'],
}
let fuse: Fuse<Country>
export const search = (
  filter: string = '',
  data: Country[] = [],
  options: Fuse.FuseOptions<any> = DEFAULT_FUSE_OPTION,
) => {
  if (data.length === 0) {
    return []
  }
  if (!fuse) {
    fuse = new Fuse<Country>(data, options)
  }
  if (filter && filter !== '') {
    const result = fuse.search(filter)
    return result
  } else {
    return data
  }
}
const uniq = (arr: any[]) => Array.from(new Set(arr))

export const getLetters = (countries: Country[]) => {
  return uniq(
    countries
      .map((country: Country) =>
        (country.name as string).substr(0, 1).toLocaleUpperCase(),
      )
      .sort((l1: string, l2: string) => l1.localeCompare(l2)),
  )
}

export interface CountryInfo {
  countryName: string
  currency: string
  callingCode: string
}
export const getCountryInfoAsync = async ({
  countryCode,
  translation,
}: {
  countryCode: CountryCode
  translation?: TranslationLanguageCode
}): Promise<CountryInfo> => {
  const countryName = await getCountryNameAsync(
    countryCode,
    translation || 'common',
  )
  const currency = await getCountryCurrencyAsync(countryCode)
  const callingCode = await getCountryCallingCodeAsync(countryCode)
  return { countryName, currency, callingCode }
}

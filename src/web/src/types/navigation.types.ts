import { 
  NavigationContainerRef, 
  ParamListBase, 
  RouteProp, 
  CompositeNavigationProp 
} from '@react-navigation/native'; // ^6.x
import { StackNavigationProp } from '@react-navigation/stack'; // ^6.x
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'; // ^6.x

/**
 * Type definition for navigation function
 */
export type NavigateFunction = <T extends object>(
  name: string,
  params?: T
) => void;

/**
 * Root stack navigation parameters
 */
export interface RootStackParamList extends ParamListBase {
  Auth: undefined;
  Main: undefined;
}

/**
 * Authentication stack navigation parameters
 */
export interface AuthStackParamList extends ParamListBase {
  Login: undefined;
  Signup: undefined;
}

/**
 * Main tab navigation parameters
 */
export interface MainTabParamList extends ParamListBase {
  Chat: undefined;
  HealthLog: undefined;
  DataEntry: undefined;
  Insights: undefined;
  Profile: undefined;
}

/**
 * Data entry stack navigation parameters
 */
export interface DataEntryStackParamList extends ParamListBase {
  Options: undefined;
  MealEntry: undefined;
  LabResultEntry: undefined;
  SymptomEntry: undefined;
}

/**
 * Health stack navigation parameters
 */
export interface HealthStackParamList extends ParamListBase {
  HealthLog: undefined;
  HealthDataDetail: { healthDataId: string };
}

/**
 * Root navigation prop type
 */
export type RootStackNavigationProp<
  RouteName extends keyof RootStackParamList = keyof RootStackParamList
> = StackNavigationProp<RootStackParamList, RouteName>;

/**
 * Authentication stack navigation prop type
 */
export type AuthStackNavigationProp<
  RouteName extends keyof AuthStackParamList = keyof AuthStackParamList
> = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, RouteName>,
  RootStackNavigationProp
>;

/**
 * Main tab navigation prop type
 */
export type MainTabNavigationProp<
  RouteName extends keyof MainTabParamList = keyof MainTabParamList
> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, RouteName>,
  RootStackNavigationProp
>;

/**
 * Data entry stack navigation prop type
 */
export type DataEntryStackNavigationProp<
  RouteName extends keyof DataEntryStackParamList = keyof DataEntryStackParamList
> = StackNavigationProp<DataEntryStackParamList, RouteName>;

/**
 * Health stack navigation prop type
 */
export type HealthStackNavigationProp<
  RouteName extends keyof HealthStackParamList = keyof HealthStackParamList
> = StackNavigationProp<HealthStackParamList, RouteName>;

/**
 * Authentication screen props
 */
export interface AuthScreenProps<RouteName extends keyof AuthStackParamList = keyof AuthStackParamList> {
  navigation: AuthStackNavigationProp<RouteName>;
  route: RouteProp<AuthStackParamList, RouteName>;
}

/**
 * Main tab screen props
 */
export interface MainTabScreenProps<RouteName extends keyof MainTabParamList = keyof MainTabParamList> {
  navigation: MainTabNavigationProp<RouteName>;
  route: RouteProp<MainTabParamList, RouteName>;
}

/**
 * Data entry screen props
 */
export interface DataEntryScreenProps<RouteName extends keyof DataEntryStackParamList = keyof DataEntryStackParamList> {
  navigation: DataEntryStackNavigationProp<RouteName>;
  route: RouteProp<DataEntryStackParamList, RouteName>;
}

/**
 * Health screen props
 */
export interface HealthScreenProps<RouteName extends keyof HealthStackParamList = keyof HealthStackParamList> {
  navigation: HealthStackNavigationProp<RouteName>;
  route: RouteProp<HealthStackParamList, RouteName>;
}

/**
 * Composite navigation prop for data entry screens
 * Combines main tab navigation with data entry stack navigation
 */
export type CompositeDataEntryScreenProps<
  RouteName extends keyof DataEntryStackParamList = keyof DataEntryStackParamList
> = {
  navigation: CompositeNavigationProp<
    DataEntryStackNavigationProp<RouteName>,
    MainTabNavigationProp
  >;
  route: RouteProp<DataEntryStackParamList, RouteName>;
};

/**
 * Composite navigation prop for health screens
 * Combines main tab navigation with health stack navigation
 */
export type CompositeHealthScreenProps<
  RouteName extends keyof HealthStackParamList = keyof HealthStackParamList
> = {
  navigation: CompositeNavigationProp<
    HealthStackNavigationProp<RouteName>,
    MainTabNavigationProp
  >;
  route: RouteProp<HealthStackParamList, RouteName>;
};
import {Tabs} from 'expo-router';
import React from 'react';
import {Platform} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {BooksProvider} from '@/contexts/BooksContext';

export default function TabLayout() {
    return (
        <BooksProvider>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: '#8E8E93',
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#E5E5EA',
                        height: Platform.OS === 'ios' ? 88 : 60,
                        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                        paddingTop: 2,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({color, focused}) => (
                            <Ionicons
                                name={focused ? 'home' : 'home-outline'}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="add"
                    options={{
                        title: 'Adicionar',
                        tabBarIcon: ({color, focused}) => (
                            <Ionicons
                                name={focused ? 'add-circle' : 'add-circle-outline'}
                                size={29}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({color, focused}) => (
                            <Ionicons
                                name={focused ? 'person' : 'person-outline'}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
            </Tabs>
        </BooksProvider>
    );
}
import { BooksProvider } from '@/src/contexts/BooksContext';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function BookLayout() {
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
                        display: 'none',
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                    },
                }}>
                <Tabs.Screen
                    name="book-details"
                />
            </Tabs>
        </BooksProvider>
    );
}
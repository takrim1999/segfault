"use client"
import React, {useEffect, useRef, useState} from "react";
import Editor, {OnChange, OnMount} from "@monaco-editor/react";
import Box from "@mui/material/Box";
import {FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Tooltip} from "@mui/material";
import * as monaco from "monaco-editor";
import {useAppDispatch, useAppSelector} from "@/lib/hooks/hooks";
import Grid from '@mui/material/Grid';
import {Language} from "@/app/problems/create/types";
import {setCodesiriusLoading, setTheme} from "@/lib/features/codesirius/codesiriusSlice";
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import RestoreIcon from '@mui/icons-material/Restore';
import {alpha, Theme} from "@mui/material/styles";
import {IconCode} from '@tabler/icons-react';
import {SiCplusplus, SiPython} from 'react-icons/si';
import {DiJava} from 'react-icons/di';

interface CodeEditorProps {
    code?: string;
    languages: Language[];
    activeLanguage: Language;
    onSourceCodeChange: OnChange;
    onLanguageChange?: (event: SelectChangeEvent) => void;
    children?: React.ReactNode;
    isSaved?: boolean;
    onReset?: () => void;
    languageSelectProps?: {
        size?: "small" | "medium";
        sx?: (theme: Theme) => any;
    };
    height?: string;
    storageKey?: string;
}

// Add type declaration for window.monaco
declare global {
    interface Window {
        monaco: typeof monaco;
    }
}

const getLanguageTemplate = (language: Language): string => {
    switch (language.name) {
        case "Python":
            return `def solution():
    # Write your code here
    pass

if __name__ == "__main__":
    solution()`;
        case "Java":
            return `public class Solution {
    public static void main(String[] args) {
        // Write your code here
    }
}`;
        case "C++":
            return `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`;
        default:
            return "";
    }
};

const CodeEditor = ({
                        code = "",
                        languages,
                        activeLanguage,
                        onSourceCodeChange,
                        onLanguageChange,
                        children,
                        isSaved = true,
                        onReset,
                        languageSelectProps,
                        height = "100%",
                        storageKey = "default"
                    }: CodeEditorProps) => {
    const theme = useAppSelector(state => state.codesirius.theme);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [fontSize, setFontSize] = useState<number>(14);
    const dispatch = useAppDispatch();
    const isInitialMount = useRef(true);

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        // Set the theme based on the current mode
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    };

    // Update editor theme when theme changes
    useEffect(() => {
        if (editorRef.current) {
            const monacoInstance = window.monaco;
            if (monacoInstance) {
                monacoInstance.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
            }
        }
    }, [theme]);

    // Update editor content when language or code changes
    useEffect(() => {
        if (editorRef.current) {
            const currentValue = editorRef.current.getValue();
            const newValue = isInitialMount.current && !code ? getLanguageTemplate(activeLanguage) : code;
            if (currentValue !== newValue) {
                console.log('Updating editor value:', { currentValue, newValue });
                editorRef.current.setValue(newValue);
            }
            isInitialMount.current = false;
        }
    }, [activeLanguage, code]);

    const formatCode = async () => {
        if (editorRef.current) {
            try {
                const currentValue = editorRef.current.getValue();
                if (!currentValue) return;

                // Get the current language
                const language = getMonacoLanguage(activeLanguage);
                
                // Call the formatting API
                const response = await fetch('/api/format', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: currentValue,
                        language,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to format code');
                }

                const { formattedCode } = await response.json();
                
                // Update the editor with formatted code
                editorRef.current.setValue(formattedCode);
            } catch (error) {
                console.error('Error formatting code:', error);
                // You might want to show a notification to the user here
            }
        }
    };

    const getMonacoLanguage = (lang: Language) => {
        switch (lang.name) {
            case "Python":
                return "python";
            case "Java":
                return "java";
            case "C++":
                return "cpp";
            default:
                return "plaintext";
        }
    }

    useEffect(() => {
        dispatch(setCodesiriusLoading(false));
    }, []);

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(30, prev + 2));
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(12, prev - 2));
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        dispatch(setTheme(newTheme));
    };

    const getLanguageIcon = (lang: Language) => {
        switch (lang.name) {
            case "Python":
                return <SiPython size={16} />;
            case "Java":
                return <DiJava size={16} />;
            case "C++":
                return <SiCplusplus size={16} />;
            default:
                return <IconCode size={16} />;
        }
    };

    return (
        <Grid container spacing={0}>
            <Grid item xs={12}>
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    height={height}
                    borderBottom={1}
                    sx={{
                        position: 'relative',
                        backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        borderColor: (theme) => alpha(theme.palette.divider, 0.3)
                    }}
                >
                    {/* VS Code-like Toolbar */}
                    <Box 
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 8px',
                            borderBottom: '1px solid',
                            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
                            pr: 8, // Add padding to prevent overlap with fullscreen button
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                    value={`${activeLanguage.id}`}
                                    onChange={onLanguageChange}
                                    displayEmpty
                                    size={languageSelectProps?.size}
                                    sx={{
                                        backgroundColor: theme === 'dark' ? '#3c3c3c' : '#ffffff',
                                        '& .MuiSelect-select': {
                                            py: 0.5,
                                            px: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'text.primary',
                                            '&:hover': {
                                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05)
                                            }
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: (theme) => alpha(theme.palette.primary.main, 0.2)
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: (theme) => alpha(theme.palette.primary.main, 0.5)
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'primary.main',
                                            borderWidth: 1
                                        },
                                        ...languageSelectProps?.sx
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                mt: 0.5,
                                                '& .MuiMenuItem-root': {
                                                    py: 0.5,
                                                    px: 1,
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05)
                                                    },
                                                    '&.Mui-selected': {
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                        '&:hover': {
                                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                >
                                    {languages.map((lang) => (
                                        <MenuItem key={lang.id} value={lang.id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {getLanguageIcon(lang)}
                                                <span>{lang.name} {lang.version}</span>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box 
                                sx={{ 
                                    height: 24,
                                    width: '1px',
                                    bgcolor: (theme) => alpha(theme.palette.divider, 0.15),
                                    mx: 1
                                }} 
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {!isSaved && onReset && (
                                    <Tooltip title="Reset Changes">
                                        <IconButton 
                                            onClick={onReset} 
                                            size="small"
                                            color="warning"
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1)
                                                }
                                            }}
                                        >
                                            <RestoreIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                
                                <Tooltip title="Format Code">
                                    <IconButton 
                                        onClick={formatCode} 
                                        size="small"
                                        sx={{
                                            '&:hover': {
                                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
                                            }
                                        }}
                                    >
                                        <FormatPaintIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title="Decrease Font Size">
                                <IconButton 
                                    onClick={decreaseFontSize} 
                                    size="small"
                                    sx={{
                                        '&:hover': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
                                        }
                                    }}
                                >
                                    <ZoomOutIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Increase Font Size">
                                <IconButton 
                                    onClick={increaseFontSize} 
                                    size="small"
                                    sx={{
                                        '&:hover': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
                                        }
                                    }}
                                >
                                    <ZoomInIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <Box 
                                sx={{ 
                                    height: 24,
                                    width: '1px',
                                    bgcolor: (theme) => alpha(theme.palette.divider, 0.15),
                                    mx: 1
                                }} 
                            />
                            
                            <Tooltip title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}>
                                <IconButton 
                                    onClick={toggleTheme} 
                                    size="small"
                                    sx={{
                                        '&:hover': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
                                        }
                                    }}
                                >
                                    {theme === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <Editor
                        height="calc(100% - 40px)"
                        defaultLanguage={languages[0].name.toLowerCase()}
                        language={getMonacoLanguage(activeLanguage)}
                        defaultValue={code}
                        onMount={handleEditorMount}
                        options={{
                            automaticLayout: true,
                            fontSize: fontSize,
                            minimap: { enabled: true },
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            renderWhitespace: 'selection',
                            padding: { top: 10, bottom: 10 },
                            scrollbar: {
                                vertical: 'visible',
                                horizontal: 'visible',
                                useShadows: false,
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10
                            },
                            bracketPairColorization: {
                                enabled: true
                            },
                            guides: {
                                bracketPairs: true,
                                indentation: true
                            },
                            suggest: {
                                preview: true,
                                showStatusBar: true
                            }
                        }}
                        theme={theme === "dark" ? "vs-dark" : "vs"}
                        onChange={onSourceCodeChange}
                    />
                </Box>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
                {children}
            </Grid>
        </Grid>
    );
};

export default CodeEditor;

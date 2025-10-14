package kr.ac.hanyang.backend.service;

import kr.ac.hanyang.backend.dto.Setting;
import kr.ac.hanyang.backend.mapper.SettingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class SettingService {

    private final SettingMapper settingMapper;
    private final Map<String, String> settingsCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        loadSettingsIntoCache();
    }

    public void refreshCache() {
        log.info("Refreshing settings cache...");
        loadSettingsIntoCache();
    }

    private void loadSettingsIntoCache() {
        List<Setting> settings = settingMapper.findAll();
        Map<String, String> newCache = settings.stream()
                .collect(Collectors.toMap(Setting::getKeyName, Setting::getValue));
        
        settingsCache.clear();
        settingsCache.putAll(newCache);
        log.info("Loaded {} settings into cache.", settingsCache.size());
    }

    public String getValue(String key, String defaultValue) {
        return settingsCache.getOrDefault(key, defaultValue);
    }

    public int getIntValue(String key, int defaultValue) {
        try {
            return Integer.parseInt(getValue(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            log.warn("Could not parse integer for key '{}'. Using default value '{}'.", key, defaultValue);
            return defaultValue;
        }
    }
}

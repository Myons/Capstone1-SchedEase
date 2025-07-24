package com.schedease.config;

import com.schedease.security.FirebaseAuthenticationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import static org.springframework.security.config.Customizer.withDefaults;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        logger.info("🔧 Configuring Spring Security...");
        
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                logger.info("🔧 Configuring authorization rules...");
                auth.requestMatchers("/api/public/**").permitAll();
                auth.requestMatchers("/api/test/**").permitAll(); // Add test endpoints
                auth.requestMatchers("/api/faculty/**").authenticated(); // Ensure faculty endpoints require auth
                auth.requestMatchers("/api/courses/**").authenticated(); // Ensure courses endpoints require auth
                auth.requestMatchers("/api/schedules/**").authenticated(); // Ensure schedules endpoints require auth
                auth.requestMatchers("/api/subjects/**").authenticated(); // Ensure subjects endpoints require auth
                auth.requestMatchers("/api/sections/**").authenticated(); // Ensure sections endpoints require auth
                auth.requestMatchers("/api/teachers/**").authenticated(); // Ensure teachers endpoints require auth
                auth.requestMatchers("/api/classrooms/**").authenticated(); // Ensure classrooms endpoints require auth
                auth.anyRequest().authenticated();
                logger.info("🔧 Authorization rules configured");
            })
            .addFilterBefore(new FirebaseAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        logger.info("🔧 Spring Security configuration complete");
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        logger.info("🔧 Configuring CORS...");
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000")); // Allow both common dev ports
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        logger.info("🔧 CORS configuration complete");
        return source;
    }
} 
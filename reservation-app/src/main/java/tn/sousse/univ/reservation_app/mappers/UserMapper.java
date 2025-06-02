package tn.sousse.univ.reservation_app.mappers;

import tn.sousse.univ.reservation_app.dto.UserDTO;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.User;

public class UserMapper {

    // Convert User entity to UserDTO
    public static UserDTO toDTO(User user) {
        if (user == null) return null;

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setPrenom(user.getPrenom());
        dto.setEmail(user.getEmail());
        dto.setNumTel(user.getNumTel());
        dto.setFonction(user.getFonction());
        dto.setRole(user.getRole().name());
        dto.setNomEtablissement(user.getNomEtablissement());
        dto.setStructure(user.getStructure());
        dto.setLinkedInLink(user.getLinkedInLink());
          dto.setEtablissementId(user.getEtablissementId());
        return dto;
    }

    // Convert UserDTO to User entity
    public static User toEntity(UserDTO dto) {
        if (dto == null) return null;

        User user = new User();
        user.setId(dto.getId());
        user.setNom(dto.getNom());
        user.setPrenom(dto.getPrenom());
        user.setEmail(dto.getEmail());
        user.setNumTel(dto.getNumTel());
        user.setFonction(dto.getFonction());
        user.setRole(Role.valueOf(dto.getRole()));
        user.setNomEtablissement(dto.getNomEtablissement());
        user.setPassword(dto.getPassword());
        user.setStructure(dto.getStructure());
        user.setLinkedInLink(dto.getLinkedInLink());
        user.setEtablissementId(dto.getEtablissementId());
        return user;
    }
}
